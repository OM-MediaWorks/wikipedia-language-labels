import { fetched } from './fetched.ts'
import { clean } from './helpers.ts'

const getAllLangCodes = async () => {
    const url = new URL('https://query.wikidata.org/sparql')
    url.searchParams.set('query', `
    SELECT DISTINCT ?s ?langCode WHERE {
        { ?s wdt:P218 ?langCode . } UNION
        { ?s wdt:P219 ?langCode . } UNION
        { ?s wdt:P220 ?langCode . }
        FILTER(ISIRI(?s))
    }
    ORDER BY ?langCode
    `)
    const response = await fetched(url, {
        headers: { 'Accept': 'application/sparql-results+json' }
    })
    
    const { results: { bindings } } = await response.json()
    return bindings.map((binding: any) => binding.langCode.value)
}

const fetchLanguageLabels = async (langCodes: Array<string>) => {
    const query = `
    SELECT *
    WHERE {
        VALUES ?langCode { ${langCodes.map((langCode) => `"${langCode}"@en`).join(' ')} }
        ?s a dbo:Language .
        ?s dbp:iso ?langCode .
        OPTIONAL { ?s dbp:nativename ?native . }
        OPTIONAL { ?s dbp:name ?name . }
    }`

    const url = new URL('http://dbpedia.org/sparql')
    url.searchParams.set('query', query)
    url.searchParams.set('format', 'application/sparql-results+json')
    const response = await fetched(url)

    const { results: { bindings } } = await response.json()
    return bindings

}

const fetchLanguages = async (langCodes: Array<string>, type: 'native' | 'label' | 'alt') => {
    const query = `
        SELECT *
        WHERE {
        {
            SELECT DISTINCT ?s ?langCode WHERE {
            VALUES ?langCode { ${langCodes.map((langCode) => `"${langCode}"`).join(' ')} }
            { ?s wdt:P218 ?langCode . } UNION
            { ?s wdt:P219 ?langCode . } UNION
            { ?s wdt:P220 ?langCode . }
            FILTER(ISIRI(?s))
            }
        }
        
        ${type === 'native' ? `
        OPTIONAL { 
            ?s wdt:P1705 ?native . 
            FILTER(LANG(?native) = ?langCode)
        }
        ` : ''}
        
        ${type === 'label' ? `
        OPTIONAL {
            ?s rdfs:label ?label
            BIND(LANG(?label) as ?labelLangCode)
        }    
        ` : ''}
            
        ${type === 'alt' ? `
        OPTIONAL {
            ?s skos:altLabel ?altLabel
            BIND(LANG(?altLabel) as ?altLabelLangCode)
        }
        ` : ''}
        
        }
        ORDER BY ASC(?langCode)
    `

    const url = new URL('https://query.wikidata.org/sparql')
    url.searchParams.set('query', query)
    const response = await fetched(url, {
        headers: { 'Accept': 'application/sparql-results+json' }
    })
    
    const { results: { bindings } } = await response.json()
    return bindings
}    

const allLangCodes = await getAllLangCodes()

const data: { [key: string]: any } = {}

const chunkSize = 100;
for (let i = 0; i < allLangCodes.length; i += chunkSize) {
    const langCodes = allLangCodes.slice(i, i + chunkSize)

    const nativePromises = (await fetchLanguages(langCodes, 'native'))
    .map((binding: any) => {
        const langCode: string = binding.langCode.value
        const native = clean(binding.native?.value?.replace(/,\'/g, ''))
        data[langCode] = { native, labels: {} }
    })

    await Promise.all(nativePromises)

    ;(await fetchLanguages(langCodes, 'label'))
    .forEach((binding: any) => {
        const langCode: string = binding.langCode.value

        const labelLangCode = clean(binding.labelLangCode.value)!
        const labelLabel = clean(binding.label.value)
        
        data[langCode].labels[labelLangCode] = labelLabel
    })
}

const missingNativeLabels = []

for (const [langCode, language] of Object.entries(data)) {
    if (!language.native) {
        missingNativeLabels.push(langCode)
    }
}

for (let i = 0; i < missingNativeLabels.length; i += chunkSize) {
    const langCodes = allLangCodes.slice(i, i + chunkSize)
    ;(await fetchLanguageLabels(langCodes)).map((binding: any) => {
        const langCode = binding.langCode.value
        const native = clean(binding.native?.value)
        const name = clean(binding.name?.value)
        data[langCode].native = native ?? name
    })

    for (const langCode of langCodes) {
        if (!data[langCode].native && data[langCode].labels[langCode]) {
            data[langCode].native = data[langCode].labels[langCode]
        }
    }
}

for (const [langCode, language] of Object.entries(data)) {
    language.labels = Object.keys(language.labels).sort().reduce((obj: any, key) => { 
        obj[key] = language.labels[key]
        return obj
    }, {})
}

await Deno.writeTextFile('./data.json', JSON.stringify(data, null, 2))
