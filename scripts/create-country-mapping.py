import urllib.request
import urllib.parse
import csv
import json
import pycountry

confirmed_data_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv'

try:
  response = urllib.request.urlopen(confirmed_data_url)
except urllib.error.HTTPError as error:
  print(error.code)
  print(error.read())

parsedData = response.read().decode('utf-8').splitlines()

csvReader = csv.reader(parsedData)
lineCount = 0
countryMapping = {
  # Special mappings that are not able to look up in pycountry
  'Korea, South': 'KOR',
  'Cruise Ship': 'CRUISE-1',
  'Taiwan*': 'TWN',
  'Congo (Kinshasa)': 'CG',
  'Congo (Brazzaville)': 'CD',
  'occupied Palestinian territory': 'PSE',
  'Gambia, The': 'GMB'
}
name = ''

for row in csvReader:
  if lineCount > 0:
    name = row[1]

    if name not in countryMapping:
      code = pycountry.countries.search_fuzzy(name)[0].alpha_3
      countryMapping[row[1]] = code
  lineCount += 1

with open('country-mapping.json', 'w') as jsonFile:
  json.dump(countryMapping, jsonFile)
