import chroma from 'chroma-js';


const countryFilter = [
  'USA',
  'CAN',
]

const colorScale = chroma.scale(['lightgreen', 'red', 'black']);
const defaultFill = [0, 0, 0, 0];

const getFillColor = (globalData, metric, isoCode, resolution) => {
  if (resolution === 'province' && countryFilter.includes(isoCode)) {
    return defaultFill;
  }
  if (globalData[isoCode] && globalData[isoCode][metric] > 0) {
    const metricValue = globalData[isoCode][metric];
    return [ ...colorScale(metricValue / 7000).rgb(), 150 ];
  }
  return defaultFill;
}

const getFillColorProvince = (globalData, metric, isoCode, resolution, provinceName) => {
  if (resolution === 'country' || !globalData[isoCode]) {
    return defaultFill;
  }
  const { provinces } = globalData[isoCode];

  if (provinces[provinceName] && provinces[provinceName][metric] > 0) {
    const metricValue = provinces[provinceName][metric];
    return [ ...colorScale(metricValue / 7000).rgb(), 150 ];
  }
  return defaultFill;
}

export {
  getFillColor,
  getFillColorProvince,
}