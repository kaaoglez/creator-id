export function generateCreatorID(countryCode: string) {

const random = Math.random()
  .toString(36)
  .substring(2,9)
  .toUpperCase()

return `${countryCode}-${random}`

}