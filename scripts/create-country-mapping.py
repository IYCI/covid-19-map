import urllib.request
import urllib.parse
import csv
import json
import pycountry
from pathlib import Path

countryMappingPath = Path(__file__).parent / '../data/country-mapping.json'
populationMappingPath = Path(__file__).parent / '../data/population-mapping.json'

confirmed_data_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv'

with open(populationMappingPath, 'r') as jsonFile:
  populationMapping = json.load(jsonFile)

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
  'Gambia, The': 'GMB',
  'Bahamas, The': 'BS'
}
hasNewPopulationEntry = False

next(csvReader) # Skip header
for row in csvReader:
    name = row[1]

    if name not in countryMapping:
      try:
        code = pycountry.countries.search_fuzzy(name)[0].alpha_3
        countryMapping[row[1]] = code
      except:
        print(f'Failed to look up iso code for {name}')

    if len(row[0]) > 0 and ',' not in row[0] and row[0] != row[1]:
      newEntry = row[0]
    else:
      newEntry = code

    if newEntry not in populationMapping and newEntry != 'From Diamond Princess':
      print(f'Adding {newEntry} to population mapping')
      populationMapping[newEntry] = ''
      hasNewPopulationEntry = True

with open(countryMappingPath, 'w') as jsonFile:
  json.dump(countryMapping, jsonFile, indent=2)

if hasNewPopulationEntry == True:
  with open(populationMappingPath, 'w') as jsonFile:
    json.dump(populationMapping, jsonFile, indent=2)
else:
  print('No new entry found')
