# Language labels

This script helps with gettings labels of languages in a given set of languages.
It is geared towards web interfaces. You give a list of content languages and a list of UI languages.
It is possible to use a fallback language for a language which might not have certain labels.

## How to use?

```
deno run get.ts CONTENT_LANGCODES_COMMA_SEPARATED UI_LANGCODES_COMMA_SEPARATED ...LANGCODE:FALLBACK_LANGCODES_COMMA_SEPARATED
```

## example
```
// Get de,fr,en,hu labels for UI in the languages: en,nl,fr,es

deno run --allow-all --watch get.ts de,fr,en,hu en,nl,fr,es

{
  "en": {
    "de": "German",
    "fr": "French",
    "en": "English",
    "hu": "Hungarian"
  },
  "nl": {
    "de": "Duits",
    "fr": "Frans",
    "en": "Engels",
    "hu": "Hongaars"
  },
  "fr": {
    "de": "allemand",
    "fr": "français",
    "en": "anglais",
    "hu": "hongrois"
  },
  "es": {
    "de": "alemán",
    "fr": "francés",
    "en": "inglés",
    "hu": "húngaro"
  }
}

```

## Generate data (refresh)

Run the following command and sit back for a while.
This will fetch language labels from WikiData nd DBpedia.

```
deno run --allow-all --watch generate.ts
```
