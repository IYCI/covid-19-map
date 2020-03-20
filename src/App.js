import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers'; // GeoJsonLayer 
import { StaticMap, NavigationControl, _MapContext as MapContext } from 'react-map-gl';
import axios from 'axios';
import { pick } from 'lodash';
import 'antd/dist/antd.css';
import { Radio } from 'antd';
import { Colorscale } from 'react-colorscales';
import chroma from 'chroma-js';
import {
  BrowserView,
  MobileView,
  // isBrowser,
  // isMobile
} from "react-device-detect";


import StatsPanel from './components/stats-panel'
import { getFillColor, getFillColorProvince, onHover, onHoverProvince } from './utils';
import './App.css';
import US_STATES from './geo/us-states.geojson';
import CANADA_PROVINCES from './geo/canada-provinces.geojson';
import CHINA_PROVINCES from './geo/china-provinces.geojson'

const MAPBOX_STYLE = 'mapbox://styles/jason-feng/ck7ryfd7y00xd1jqkfxb237mx'
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
const colorScale = chroma.scale(['#fefee9', '#6c0101']);
const colorBreakDown = Array.apply(null, Array(10)).map((_, i) => colorScale(i / 10));

function App() {
  // eslint-disable-next-line no-unused-vars
  const [staticMap, setStaticMap] = useState();
  const [geoJson, setGeoJson] = useState();
  // globalData: { <countryCode>: { provinceState, countryRegion, lastUpdate, lat, long, confirmed, recovered, deaths, active } }
  const [globalData, setGlobalData] = useState({});
  const [toolTipData, setToolTip] = useState(); // { x, y, id, name, data: { confirmed, deaths, recovered } }
  const [metric, setMetric] = useState('active');
  const [resolution, setResolution] = useState('province');
  const [colorMax, setColorMax] = useState(1000);

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
    const { x, y, name, id, data: { confirmed = 0, deaths = 0, recovered = 0, active = 0, lastUpdate = null } = {} } = toolTipData;
    return (
      <React.Fragment>
        <BrowserView>
          <div style={{ position: 'fixed', zIndex: 5, pointerEvents: 'none', left: x, top: y, backgroundColor: 'white', padding: '1rem', borderRadius: '4px', minWidth: '200px' }}>
            <h2 style={{ margin: '0 0 1rem 0' }}>{name} - {id}</h2>
            <div>active: {active}</div>
            <div>confirmed: {confirmed}</div>
            <div>deaths: {deaths}</div>
            <div>recovered: {recovered}</div>
            { lastUpdate && (<div>last update: {new Date(lastUpdate).toLocaleString()}</div>)}
          </div>
        </BrowserView>
        <MobileView>
          <div style={{ position: 'absolute', zIndex: 5, left: '1rem', right: '1rem', bottom: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '4px' }}>
            <h2 style={{ margin: '0 0 1rem 0' }}>{name} - {id}</h2>
            <div>active: {active}</div>
            <div>confirmed: {confirmed}</div>
            <div>deaths: {deaths}</div>
            <div>recovered: {recovered}</div>
            { lastUpdate && (<div>last update: {new Date(lastUpdate).toLocaleString()}</div>)}
          </div>
        </MobileView>
      </React.Fragment>
    );
  }

  const onResolutionChange = ({ target: { value } }) => {
    setResolution(value);
    if (value === 'country') {
      setColorMax(15000);
    } else {
      setColorMax(1000);
    }
  }

  /* rendering */
  const layers = [
    new GeoJsonLayer ({
      id: 'countries-geo-json',
      data: geoJson,
      highlightColor: [0, 0, 0, 50],
      autoHighlight: true,
      getFillColor: d => getFillColor(globalData, colorMax, metric, d.id, resolution),
      updateTriggers: {
        getFillColor: [globalData, metric, resolution]
      },

      /* interact */
      pickable: true,
      onHover: data => onHover(data, setToolTip, globalData, resolution),
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
      visible: resolution === 'province',
      getFillColor: d => getFillColorProvince(globalData, colorMax, metric, 'USA', resolution, d.properties.name),
      updateTriggers: {
        getFillColor: [globalData, metric, resolution]
      },
      pickable: true,
      onHover: data => onHoverProvince(data, setToolTip, globalData, resolution),
      onClick: (data) => {
        console.log('clicked:', data)
      },
    }),
    new GeoJsonLayer ({
      id: 'canada-provinces-geo-json',
      data: CANADA_PROVINCES,
      highlightColor: [0, 0, 0, 50],
      autoHighlight: true,
      visible: resolution === 'province',
      getFillColor: d => getFillColorProvince(globalData, colorMax, metric, 'CAN', resolution, d.properties.name),
      updateTriggers: {
        getFillColor: [globalData, metric, resolution]
      },
      pickable: true,
      onHover: data => onHoverProvince(data, setToolTip, globalData, resolution),
      onClick: (data) => {
        console.log('clicked:', data)
      },
    }),
    new GeoJsonLayer ({
      id: 'china-provinces-geo-json',
      data: CHINA_PROVINCES,
      highlightColor: [0, 0, 0, 50],
      autoHighlight: true,
      visible: resolution === 'province',
      getFillColor: d => getFillColorProvince(globalData, colorMax, metric, 'CHN', resolution, d.properties.name),
      updateTriggers: {
        getFillColor: [globalData, metric, resolution]
      },
      pickable: true,
      onHover: data => onHoverProvince(data, setToolTip, globalData, resolution),
      onClick: (data) => {
        console.log('clicked:', data)
      },
    }),
  ];

  return (
    <div>
      <div style={{ margin: '1rem', position: 'absolute', zIndex: 2 }}>
        <Radio.Group value={metric} onChange={e => setMetric(e.target.value)}
          style={{ marginBottom: '1rem', marginRight: '1rem', whiteSpace: 'nowrap' }}>
          <Radio.Button value="active">Active</Radio.Button>
          <Radio.Button value="confirmed">Confirmed</Radio.Button>
          <Radio.Button value="deaths">Deaths</Radio.Button>
          <Radio.Button value="recovered">Recovered</Radio.Button>
        </Radio.Group>
        <Radio.Group value={resolution} onChange={onResolutionChange}>
          <Radio.Button value="country">Country</Radio.Button>
          <Radio.Button value="province">Province</Radio.Button>
        </Radio.Group>
      </div>
      <DeckGL
        initialViewState={initialViewState}
        controller={true}
        layers={layers}
        Style={{ width: '100vw', height: '100vh'}}
        ContextProvider={MapContext.Provider}
      >
        <StaticMap ref={setStaticMap} width='100%' height='100%' mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} mapStyle={MAPBOX_STYLE} />
        <div style={{ position: "absolute", right: '1rem', bottom: '6rem', zIndex: 10 }}>
          <NavigationControl showCompass={false} />
        </div>
      </DeckGL>
      { _renderTooltip() }
      <StatsPanel globalData={globalData} />
      <div style={{ zIndex: 3, position: 'absolute', bottom: '1.5rem', right: '1rem', width: '250px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>0</span>
          <span>number of {metric} cases</span>
          <span>{colorMax}</span>
        </div>
        <Colorscale
          colorscale={colorBreakDown}
          onClick={() => {}}
          width='150px'
        />
      </div>
    </div>
  );
}

export default App;
