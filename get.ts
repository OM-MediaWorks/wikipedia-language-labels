import data from './data.json' assert { type: "json" }
import { colors } from 'https://deno.land/x/cliffy@v0.25.4/ansi/colors.ts'

const languages = data as unknown as {
    [key: string]: {
        native: string,
        labels: {
            [key: string]: string
        }
    }
}

const [contentLangCodesString, uiLangCodesString, ...fallbacksString] = Deno.args
const contentLangCodes = contentLangCodesString.split(',')
const uiLangCodes = uiLangCodesString.split(',')

const fallbacks: {
    [key: string]: Array<string>
} = {}

for (const fallbackString of fallbacksString) {
    const [fallbackLangCode, fallbackLangCodes] = fallbackString.split(':')
    fallbacks[fallbackLangCode] = fallbackLangCodes.split(',')
}

const labels: {
    [key: string]: {
        [key: string]: string
    }
} = {}

const s = colors.underline.bold

const resolveLabel = (languageCode: string, translationCode: string, fallbackCodes: Array<string> = [], isFallback: false | string = false): string | void => {
    if (languages[languageCode]?.labels[translationCode]) {
        if (isFallback) {
            console.error(colors.yellow(`Using a fallback language ${s(translationCode)} for the label of language ${s(languageCode)} in the original language ${s(isFallback)} `))
        }
            
        return languages[languageCode].labels[translationCode]
    }
    else {
        if (fallbackCodes.length) {
            const nextFallback = fallbackCodes.shift()!
            return resolveLabel(languageCode, nextFallback, fallbackCodes, translationCode)
        }
    }
}

for (const langCode of uiLangCodes) {
    labels[langCode] = {}

    for (const innerLangCode of contentLangCodes) {
        const translated = resolveLabel(innerLangCode, langCode, fallbacks[langCode] ? [...fallbacks[langCode]]: [], false)
        if (translated) {
            labels[langCode][innerLangCode] = translated
        }
        else {
            labels[langCode][innerLangCode] = innerLangCode
            console.error(colors.red(`Could not get the label for language ${s(langCode)} in the translation language ${s(innerLangCode)} `))
        }
    }
}

console.log(JSON.stringify(labels, null, 2))