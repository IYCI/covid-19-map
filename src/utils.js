import chroma from 'chroma-js';


const countryFilter = [
  'USA',
  'CAN',
  'CHN',
  'TWN',
]

const colorScale = chroma.scale(['#fefee9', '#6c0101']);
const defaultFill = [0, 0, 0, 0];

const getFillColor = (globalData, colorMax, metric, isoCode, resolution) => {
  if (resolution === 'province' && countryFilter.includes(isoCode)) {
    return defaultFill;
  }
  if (globalData[isoCode] && globalData[isoCode][metric] > 0) {
    const metricValue = globalData[isoCode][metric];
    return [ ...colorScale(metricValue / colorMax).rgb(), 150 ];
  }
  return defaultFill;
}

const getFillColorProvince = (globalData, colorMax, metric, isoCode, resolution, provinceName) => {
  if (resolution === 'country' || !globalData[isoCode]) {
    return defaultFill;
  }
  const { provinces } = globalData[isoCode];

  if (provinces[provinceName] && provinces[provinceName][metric] > 0) {
    const metricValue = provinces[provinceName][metric];
    return [ ...colorScale(metricValue / colorMax).rgb(), 150 ];
  }
  return defaultFill;
}


const onHover = (data, setToolTip, globalData, resolution) => {
  if (data.object) {
    const { x, y, object: { id, properties } } = data;
    if (resolution === 'province' && countryFilter.includes(id)) {
      return setToolTip(null);
    }

    const stats = globalData[id];
    setToolTip({ name: properties.name, data: stats, id, x, y })
  } else {
    setToolTip(null);
  }
}

const onHoverProvince = (data, setToolTip, globalData, resolution) => {
  if (data.object) {
    const { x, y, object: { properties: { iso3, name } } } = data;
    const provinces = globalData[iso3].provinces;
    if (iso3 === 'CHN' && name === 'Taiwan') {
      return setToolTip({ data: globalData['TWN'], x, y, id: name, name: iso3 })
    }
    if (!provinces[name]) {
      return setToolTip(null);
    }
    setToolTip({ data: provinces[name], x, y, id: name, name: iso3 })
  } else {
    setToolTip(null);
  }
}

export {
  getFillColor,
  getFillColorProvince,
  onHover,
  onHoverProvince,
}