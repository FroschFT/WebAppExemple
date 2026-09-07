from collections import Counter
import unittest

from app.kanji.data import KANJI_CARDS


class KanjiDataTests(unittest.TestCase):
    def test_dataset_has_ten_cards_per_level(self):
        self.assertEqual(
            Counter(card['level'] for card in KANJI_CARDS),
            Counter({
                'T1': 10,
                'T2': 10,
                'T3': 10,
                'T4': 10,
                'T5': 10,
            }),
        )

    def test_characters_are_unique(self):
        characters = [card['character'] for card in KANJI_CARDS]

        self.assertEqual(len(characters), 50)
        self.assertEqual(len(set(characters)), len(characters))

    def test_every_card_has_required_content(self):
        for card in KANJI_CARDS:
            with self.subTest(character=card['character']):
                self.assertTrue(card['character'].strip())
                self.assertTrue(card['reading'].strip())
                self.assertTrue(card['meaning'].strip())
                self.assertIn(card['level'], {'T1', 'T2', 'T3', 'T4', 'T5'})
