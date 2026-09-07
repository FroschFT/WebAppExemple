# CI/CD

WebApp Example uses GitHub Actions for a small, explicit automation pipeline:

```text
Pull request or feature branch
  -> reusable quality gate on Ubuntu, Windows, and macOS
  -> Docker build validation

Main branch, version tag, or manual delivery
  -> reusable quality gate
  -> Docker build
  -> GitHub Container Registry
```

## Workflow files

| File | Responsibility |
| --- | --- |
| [quality.yml](../.github/workflows/quality.yml) | Reusable Python dependency, compile, and test gate |
| [ci.yml](../.github/workflows/ci.yml) | Pull-request and feature-branch validation |
| [cd.yml](../.github/workflows/cd.yml) | Tested container publication to GHCR |
| [dependabot.yml](../.github/dependabot.yml) | Monthly Python and Actions dependency updates |

## Quality gate

`quality.yml` is called by both CI and CD. It accepts a GitHub runner label and
Python version, defaulting to `ubuntu-24.04` and Python `3.11`. It:

1. checks out the repository
2. installs Python 3.11 with pip caching
3. installs `requirements.txt`
4. runs `pip check`
5. compiles the application and tests
6. runs all tests with `ResourceWarning` promoted to an error

The test command matches local development:

```bash
python -W error::ResourceWarning -m unittest discover -s tests -v
```

Each job has read-only repository permissions and a 10-minute timeout.

## Continuous integration

`ci.yml` runs for:

- every pull request
- pushes to branches other than `main`
- manual dispatch from the Actions tab

CI runs the quality gate with `fail-fast` disabled on:

| Runner | Coverage |
| --- | --- |
| `ubuntu-24.04` | Pinned Linux LTS environment |
| `ubuntu-latest` | Moving canary for GitHub's current default Ubuntu image |
| `windows-2022` | Windows Server runner |
| `macos-14` | macOS runner |

All four jobs use Python 3.11, matching the delivered container. A failure on
one platform does not cancel the remaining platforms, which keeps diagnostics
complete.

Keeping both Ubuntu entries is intentional: `ubuntu-24.04` provides a stable,
reproducible baseline, while `ubuntu-latest` reveals compatibility issues when
GitHub moves its default runner image.

GitHub-hosted macOS jobs may consume more billed minutes than Linux jobs in
private repositories. Remove that matrix entry if the extra platform coverage
is not worth the project cost.

After every matrix job passes, CI uses Docker Buildx on `ubuntu-24.04` to build `dockerfile`
without publishing the image. It starts that image with a temporary production
secret, waits for an HTTP response from `/`, and always removes the container.
GitHub Actions cache is used for build layers.

Pushes to `main` do not run a duplicate CI workflow because CD calls the same
quality gate before publication.

## Continuous delivery

`cd.yml` runs for:

- pushes to `main`
- tags matching `v*.*.*`, such as `v1.2.3`
- manual dispatch from the Actions tab

CD runs the reusable quality gate on its pinned `ubuntu-24.04` default. After
quality checks pass, the workflow logs in to GitHub Container Registry
with the repository's automatically provided `GITHUB_TOKEN`, builds the image,
and pushes metadata-generated tags.

Typical tags:

| Trigger | Example tags |
| --- | --- |
| Push to `main` | `main`, `latest`, `sha-<commit>` |
| Tag `v1.2.3` | `1.2.3`, `1.2`, `sha-<commit>` |
| Manual branch run | branch name, `sha-<commit>` |

The image is published as:

```text
ghcr.io/<owner>/<repository>:<tag>
```

The metadata action normalizes the image name for the container registry.

## Permissions and secrets

Permissions are intentionally minimal:

- quality and CI: `contents: read`
- CD publisher: `contents: read`, `packages: write`

No custom GitHub secret is required to publish to GHCR. The workflow uses
`secrets.GITHUB_TOKEN`.

`SECRET_KEY` is a runtime application secret. It is not embedded in the image
or stored in the workflow.

## Running the delivered image

Replace the owner and repository values with the GitHub package path:

```bash
docker pull ghcr.io/<owner>/<repository>:latest
docker run --rm -p 8081:8081 \
  -e SECRET_KEY=replace-with-a-random-production-secret \
  ghcr.io/<owner>/<repository>:latest
```

The container:

- runs Python 3.11
- runs as a non-root `app` user
- listens on port `8081`
- reports health by requesting `http://127.0.0.1:8081/`

## Release flow

1. Open a pull request and wait for CI.
2. Merge into `main`.
3. CD publishes `main`, `latest`, and commit tags.
4. When ready for a release, create and push a semantic version tag:

```bash
git tag v1.2.3
git push origin v1.2.3
```

5. Use the immutable digest written to the workflow summary for environment deployment.

## Deployment boundary

This repository implements continuous **delivery** to GHCR. It does not deploy
to Kubernetes, a virtual machine, or a managed application platform because no
target environment has been selected.

Once a target exists, add a separate deployment job or workflow that:

- consumes the published image digest
- uses a protected GitHub Environment
- stores platform credentials in environment secrets
- supports rollback
- runs an environment-level smoke test

Keep image publication and environment deployment separate so the same tested
artifact can move safely between environments.

## Recommended repository settings

- Require the CI quality and container jobs before merging.
- Protect the `main` branch.
- Restrict who can create release tags.
- Review Dependabot pull requests through the normal CI path.
- Configure GHCR package visibility for the intended audience.
