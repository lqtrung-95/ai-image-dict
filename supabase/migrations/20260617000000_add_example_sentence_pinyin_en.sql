alter table vocabulary_items
  add column if not exists example_sentence_pinyin text,
  add column if not exists example_sentence_en text;
