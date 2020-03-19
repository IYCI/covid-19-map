import urllib.request
import urllib.parse
import csv
import json
from datetime import datetime
from pathlib import Path

CONFIRMED_DATA_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv'
DEATHS_DATA_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv'
RECOVERED_DATA_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv'

def convertDateString(original):
  return datetime.strptime(original, '%m/%d/%y').strftime('%y/%m/%d')

"""
Creates initial country data object with CONFIRMED_DATA_URL
Modifies countryData global variable to the following format:
{
  <country-iso3-code>: {
    countryName,
    timeSeries: {
      <date1>: { c, d, r }
    },
    provinces: {
      <provinceName1>: {
        timeSeries: {
          <date>: { c, d, r }
        }
      },
      <provinceName2>: {
        timeSeries: {
          <date>: { c, d, r }
        }
      }
    }
  }
}

Where:
c - Confirmed
d - Deaths
r - Recovered
"""
def create_inital_data():
  try:
    response = urllib.request.urlopen(CONFIRMED_DATA_URL)
  except urllib.error.HTTPError as error:
    print(error.code)
    print(error.read())

  parsedData = response.read().decode('utf-8').splitlines()

  csvReader = csv.reader(parsedData)
  headers = []
  countryCode = ''

  for row in csvReader:
    if len(headers) == 0:
      headers = row
      continue

    countryName = row[1]
    if countryName not in countryMapping:
      print(f'{countryName} is not found in country mapping!')
      break
    countryCode = countryMapping.get(countryName)

    timeSeries = {}
    for i in range(4, len(headers)):
      date = convertDateString(headers[i])
      if len(row[i]) > 0:
        c = int(row[i])
      else:
        c = ''

      timeSeries[date] = {
          'c': c,
          'd': '',
          'r': '',
      }

    coordinates = {
      'lat': row[2],
      'long': row[3]
    }

    countryObject = countryData.get(countryCode)
    if countryObject == None:
      countryObject = {
        'countryName': countryName,
        'provinces': {}
      }

    provinceName = row[0]
    if len(provinceName) > 0:
      countryObject['provinces'][provinceName] = {
        'timeSeries': timeSeries,
        'coordinates': coordinates
      }
    else:
      countryObject['coordinates'] = coordinates
      countryObject['timeSeries'] = timeSeries
    countryData[countryMapping[countryName]] = countryObject

"""
Modifies existing countryData global variable and update the provided field
with data from url
ex. appendMetricData(RECOVERED_DATA_URL, 'r') will update the r (recovered) field in the
timeSeries with data from RECOVERED_DATA_URL
"""
def appendMetricData(url, field):
  try:
    response = urllib.request.urlopen(url)
  except urllib.error.HTTPError as error:
    print(error.code)
    print(error.read())
    return

  parsedData = response.read().decode('utf-8').splitlines()
  csvReader = csv.reader(parsedData)
  headers = []

  for row in csvReader:
    if len(headers) == 0:
      headers = row
      continue

    countryName = row[1]
    if countryName not in countryMapping:
      print(f'{countryName} is not found in country mapping!')
      break

    countryCode = countryMapping.get(countryName)
    countryObj = countryData.get(countryCode)
    provinceName = row[0]

    if len(provinceName) > 0:
      timeSeries = countryObj['provinces'][provinceName]['timeSeries']
    else:
      timeSeries = countryObj.get('timeSeries')

    for i in range(4, len(headers)):
      date = convertDateString(headers[i])
      if len(row[i]) > 0:
        value = int(row[i])
      else:
        value = ''
      timeSeries[date][field] = value

def main():
  create_inital_data()
  appendMetricData(DEATHS_DATA_URL, 'd')
  appendMetricData(RECOVERED_DATA_URL, 'r')
  countryData['timestamp'] = round(datetime.now().timestamp())
  fileOutputPath = Path(__file__).parent / 'country-data.json'
  with open(fileOutputPath, 'w') as f:
    json.dump(countryData, f)

if __name__ == '__main__':
  countryData = {}
  countryMappingPath = Path(__file__).parent / 'country-mapping.json'
  with open(countryMappingPath) as f:
    countryMapping = json.load(f)
  main()
