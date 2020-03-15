import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer  } from '@deck.gl/layers'; // GeoJsonLayer 
import { StaticMap } from 'react-map-gl';
import axios from 'axios';
import chroma from 'chroma-js';
import { pick } from 'lodash';

import './App.css';
import US_STATES from './geo/us-states.geojson';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiamFzb24tZmVuZyIsImEiOiJjazdyeWJwNGMwNG1mM2hsOGRna2FjZDZwIn0.9VnUs6uEsVOnw_WqMUwQVg' // jason
// const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiaGF4emllIiwiYSI6ImNqZ2c2NWp3OTBxenAzM3FzeThydmZ0YncifQ.584ugILuKFfDPTxqyiO_0g' // borrow
const initialViewState = {
  longitude: 0,
  latitude: 26,
  zoom: 2,
  pitch: 0,
  bearing: 0
};
const GEO_JSON_API = 'https://raw.githubusercontent.com/haxzie/covid19-layers-api/master/data/layers/geo.json';
const GLOBAL_API = 'https://covid19.mathdro.id/api/confirmed';
const fieldsToFilter = ['provinceState', 'countryRegion', 'lastUpdate', 'lat', 'long', 'confirmed', 'recovered', 'deaths', 'active'];
const metrics = ['confirmed', 'recovered', 'deaths', 'active'];
const colorScale = chroma.scale(['lightgreen', 'red', 'black']);

function App() {
  const [geoJson, setGeoJson] = useState();
  // globalData: { <countryCode>: { provinceState, countryRegion, lastUpdate, lat, long, confirmed, recovered, deaths, active } }
  const [globalData, setGlobalData] = useState({});
  const [toolTipData, setToolTip] = useState(); // { x, y, id, name, data: { confirmed, deaths, recovered } }

  useEffect(() => {
    const loadData = async () => {
      try {
        const unixTime = new Date().valueOf();
        const [{ data: geoJSONData }, { data: globalDataList }] = await Promise.all([
          axios.get(`${GEO_JSON_API}?ts=${unixTime}`),
          axios.get(GLOBAL_API),
        ]);
        
        const globalDataMap = {};
        globalDataList.forEach(d => {
          let country = globalDataMap[d.iso3];
          if (!country) {
            globalDataMap[d.iso3] = pick(d, ['countryRegion', 'lastUpdate', 'confirmed', 'recovered', 'deaths', 'active']);
            globalDataMap[d.iso3].provinces = { [d.provinceState]: pick(d, fieldsToFilter) };
          } else {
            metrics.forEach(m => {
              country[m] += d[m];
            });
            if (d.lastUpdate > country.lastUpdate) {
              country.lastUpdate = d.lastUpdate;
            }
            country.provinces[d.provinceState] = pick(d, fieldsToFilter);
          }
        })
        window.globalDataMap = globalDataMap; // for debugging purpose
        console.log(globalDataMap)
        setGlobalData(globalDataMap);
        setGeoJson(geoJSONData);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  const _renderTooltip = () => {
    if (!toolTipData) {
      return null;
    }
    const { x, y, name, id, data: { confirmed, deaths, recovered, active } } = toolTipData;
    return (
      <div style={{ position: 'absolute', zIndex: 1, pointerEvents: 'none', left: x, top: y, backgroundColor: 'white', padding: '1rem', borderRadius: '4px' }}>
        <h2 style={{ margin: '0 0 1rem 0' }}>{name} - {id}</h2>
        <div>confirmed: {confirmed}</div>
        <div>deaths: {deaths}</div>
        <div>recovered: {recovered}</div>
        <div>active: {active}</div>
      </div>
    );
  }


  /* rendering */
  const layers = [
    new GeoJsonLayer ({
      id: 'countries-geo-json',
      data: geoJson,
      highlightColor: [0, 0, 0, 50],
      autoHighlight: true,
      getFillColor: d => {
        const metric = 'confirmed'; // TODO: make this switchable
        if (['USA'].includes(d.id)) { // temperary solution to hide for country that province layer exists
          return [0, 0, 0, 0];
        }
        if (globalData[d.id] && globalData[d.id][metric] > 0) {
          const metricValue = globalData[d.id][metric];
          return colorScale(metricValue / 7000).rgb();
        }
        return [0, 0, 0, 0];
      },

      /* interact */
      pickable: true,
      // onHover: (asd) => {
      //   console.log(asd)
      // },
      onHover: (data) => {
        if (data.object) {
          const { x, y, object: { id, properties } } = data;
          if (id === 'USA') {
            return setToolTip(null);
          }
          setToolTip({ ...properties, id, x, y })
        } else {
          setToolTip(null);
        }
      },
      onClick: (data) => {
        console.log('clicked:', data)
        console.log('country data:', globalData[data.object.id]);
      }
    }),
    new GeoJsonLayer ({
      id: 'us-states-geo-json',
      data: US_STATES,
      highlightColor: [0, 0, 0, 50],
      autoHighlight: true,
      getFillColor: d => {
        if (!globalData['USA']) {
          return [0, 0, 0, 0];
        }
        const metric = 'confirmed'; // TODO: make this switchable
        const states = globalData['USA'].provinces;
        if (states[d.properties.name] && states[d.properties.name][metric] > 0) {
          // console.log(states[d.properties.name])
          const metricValue = states[d.properties.name][metric];
          return colorScale(metricValue / 3000).rgb();
        }
        return [0, 0, 0, 0];
      },
      updateTriggers: {
        getFillColor: [globalData]
      },
      pickable: true,
      onHover: (data) => {
        if (data.object) {
          const { x, y, object: { properties: { name } } } = data;
          const states = globalData['USA'].provinces;
          // console.log(states[name])
          // const stats = states[name]
          if (!states[name]) {
            return setToolTip(null);
          }
          setToolTip({ data: states[name], x, y, id: name, name: 'USA' })
        } else {
          setToolTip(null);
        }
      },
      onClick: (data) => {
        console.log('clicked:', data)
      },
    }),
  ];

  return (
    <DeckGL
      initialViewState={initialViewState}
      controller={true}
      layers={layers}
    >
      <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} />
      { _renderTooltip() }
    </DeckGL>
  );
}

export default App;
