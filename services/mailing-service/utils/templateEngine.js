// services/mailing-service/utils/templateEngine.js

/**
 * Simple template replacement engine
 * Replaces {{key}} placeholders with values from data object
 */
function renderTemplate(template, data) {
    if (!template || !data) return template
    
    let result = template
    for (const [key, value] of Object.entries(data)) {
        const placeholder = new RegExp(`{{${key}}}`, 'g')
        result = result.replace(placeholder, value ?? '')
    }
    return result
}

/**
 * Validates that all required fields are present in data
 */
function validateTemplateData(data, requiredFields = []) {
    const missing = requiredFields.filter(field => !data[field])
    if (missing.length > 0) {
        throw new Error(`Missing required template data: ${missing.join(', ')}`)
    }
}

module.exports = { renderTemplate, validateTemplateData }
