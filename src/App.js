import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer  } from '@deck.gl/layers'; // GeoJsonLayer 
import { StaticMap } from 'react-map-gl';
import axios from 'axios';
import chroma from 'chroma-js';

import './App.css';

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
const colorScale = chroma.scale(['lightgreen', 'red']);

function App() {
  const [geoJson, setGeoJson] = useState();
  const [toolTipData, setToolTip] = useState(); // { x, y, id, name, data: { confirmed, deaths, recovered } }
  useEffect(() => {
    const getGeoJSON = async () => {
      try {
        const unixTime = new Date().valueOf();
        const { data } = await axios.get(`${GEO_JSON_API}?ts=${unixTime}`);
        setGeoJson(data);
      } catch (err) {
        console.error(err);
      }
    };
    getGeoJSON();
  }, []);

  const _renderTooltip = () => {
    if (!toolTipData) {
      return null;
    }
    const { x, y, name, data: { confirmed, deaths, recovered } } = toolTipData;
    return (
      <div style={{ position: 'absolute', zIndex: 1, pointerEvents: 'none', left: x, top: y, backgroundColor: 'white', padding: '1rem', borderRadius: '4px' }}>
        <h2 style={{ margin: '0 0 1rem 0' }}>{name}</h2>
        <div>confirmed: {confirmed}</div>
        <div>deaths: {deaths}</div>
        <div>recovered: {recovered}</div>
      </div>
    );
  }


  /* rendering */
  const layers = [
    new GeoJsonLayer ({
      id: 'countries-geo-json',
      data: geoJson,
      getFillColor: d => {
        if (d.properties.data.confirmed > 0) {
          return colorScale(d.properties.data.confirmed / 7000).rgb();
        }
        return [0, 0, 0, 0];
      },
      getLineColor: 'black',

      /* interact */
      pickable: true,
      // onHover: (asd) => {
      //   console.log(asd)
      // },
      onHover: (data) => {
        if (data.object) {
          const { x, y, object: { id, properties } } = data;
          setToolTip({ ...properties, id, x, y })
        } else {
          console.log('asdasd')
          setToolTip(null);
        }
      },
    })
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
