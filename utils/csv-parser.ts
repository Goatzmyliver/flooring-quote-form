/**
 * Parse CSV content into product objects
 * @param csvContent The CSV content as a string
 * @returns Array of product objects
 */
export function parseProductCSV(csvContent: string): any[] {
  // Split the content into lines
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim() !== "")

  if (lines.length < 2) {
    throw new Error("CSV file must contain a header row and at least one data row")
  }

  // Parse the header row to get column names
  const headers = parseCSVLine(lines[0])

  // Required fields
  const requiredFields = ["name", "category", "price"]

  // Check if all required fields are present
  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      throw new Error(`CSV is missing required field: ${field}`)
    }
  }

  // Parse each data row
  const products = []

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i])

      // Skip if we have an empty line or not enough values
      if (values.length < requiredFields.length) continue

      // Create a product object by mapping headers to values
      const product: Record<string, any> = {}

      headers.forEach((header, index) => {
        if (index < values.length) {
          let value = values[index]

          // Convert numeric fields
          if (header === "price" || header === "roll_width" || header === "rollWidth") {
            value = value ? Number(value) : header === "price" ? 0 : null
          }

          // Handle rollWidth to roll_width conversion
          if (header === "rollWidth") {
            product["roll_width"] = value
          }
          // Parse colors as array
          else if (header === "colors" && value) {
            product[header] = value.split(",").map((color: string) => color.trim())
          } else {
            product[header] = value
          }
        }
      })

      products.push(product)
    } catch (error) {
      console.error(`Error parsing line ${i + 1}:`, error)
      // Continue with next line instead of failing the whole import
    }
  }

  return products
}

/**
 * Parse a single CSV line, handling quoted values with commas
 * @param line A single line from the CSV file
 * @returns Array of values from the line
 */
function parseCSVLine(line: string): string[] {
  const result = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ""
    } else {
      // Add character to current field
      current += char
    }
  }

  // Add the last field
  result.push(current.trim())

  // Clean up quoted values
  return result.map((value) => {
    // Remove surrounding quotes and replace double quotes with single
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.substring(1, value.length - 1).replace(/""/g, '"')
    }
    return value
  })
}

export const loadProductsFromStorage = () => {
  // This function is intentionally left blank as it is not used in the project
  return []
}

