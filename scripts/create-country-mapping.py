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
  'Gambia, The': 'GMB',
  'Bahamas, The': 'BS'
}
name = ''
populationMap = {}

next(csvReader) # Skip header
for row in csvReader:
    name = row[1]

    if name not in countryMapping:
      try:
        code = pycountry.countries.search_fuzzy(name)[0].alpha_3
        countryMapping[row[1]] = code
      except:
        print(f'Failed to look up iso code for {name}')

    if len(row[0]) > 0 and ',' not in row[0]:
      populationMap[row[0]] = ''
    else:
      populationMap[code] = ''

with open('population.csv', 'r') as f:
  reader = csv.reader(f)
  next(reader)
  for entry in reader:
    if entry[1] in populationMap:
      filtered = list(filter(lambda x: len(x) > 0, entry))
      populationMap[entry[1]] = int(filtered[-1])


with open('country-mapping.json', 'w') as jsonFile:
  json.dump(countryMapping, jsonFile)

with open('population-mapping.json', 'w') as jsonFile:
  json.dump(populationMap, jsonFile)
