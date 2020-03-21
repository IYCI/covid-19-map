import React, { useState } from 'react';
import { Statistic, Card, List, Button, Breadcrumb } from 'antd';
import { LineChartOutlined, CloseOutlined } from '@ant-design/icons';
import numeral from 'numeral';
import { isEmpty } from 'lodash';

import './stats-panel.css';


export default function StatsPanel ({ globalData }) {
  const [minimized, setMinimized] = useState(false);
  const [metric, setMetric] = useState('active');
  const [countryCode, setCountry] = useState(); // iso3

  let total = {
    active: 0,
    confirmed: 0,
    recovered: 0,
    deaths: 0,
  }
  const metricList = Object.keys(total);

  let areaList = [];
  if (countryCode && globalData[countryCode]) { // country
    total = globalData[countryCode];
    if (!isEmpty(globalData[countryCode].provinces)) {
      areaList = Object.entries(globalData[countryCode].provinces).map(([areaCode, data]) => {
        return { ...data, areaCode, name: data.provinceState || 'N/A' };
      })
    }
  } else { // global
    areaList = Object.entries(globalData).map(([areaCode, data]) => {
      total.confirmed += data.confirmed;
      total.active += data.active;
      total.recovered += data.recovered;
      total.deaths += data.deaths;
      return { ...data, areaCode, name: data.countryRegion };
    })
  }
  areaList.sort((c1, c2) => c2[metric] - c1[metric]);
  console.log(areaList);
  
  const resetPanel = () => {
    setMinimized(false);
    setCountry(null);
  }
  
  if (minimized) {
    return (
      <Button
        onClick={() => resetPanel()}
        className='minimized-button'
        icon={<LineChartOutlined />}
        size='large'
      />
    )
  }

  const listItemClasses = `stats-list-item ${countryCode ? '' : 'clickable'}`;
  const collapseBtn = (
    <Button
      onClick={() => setMinimized(true)}
      type='link'
      icon={<CloseOutlined />}
      style={{ color: 'rgba(0, 0, 0, 0.45)'}}>
    </Button>
  );
  return (
    <Card
      title={(
        <CardTitle country={countryCode && globalData[countryCode].countryRegion} setCountry={setCountry} />
      )}
      className='stats-panel'
      extra={collapseBtn}
    >
      <div className='stats-group'>
        {metricList.map(m => (
          <div className='stats-wrapper' onClick={() => setMetric(m)} key={m}>
            <Statistic
              className={metric === m && 'activeMetric'}
              title={m}
              value={total[m]}
            />
          </div>
        ))}
      </div>
      {areaList && areaList.length > 0 && (
        <List
          className='stats-list'
          dataSource={areaList}
          renderItem={area => (
            <List.Item
              className={listItemClasses} onClick={() => !countryCode && setCountry(area.areaCode)}>
              {area.name}
              <span>{numeral(area[metric]).format('0,0')}</span>
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

const CardTitle = ({ country, setCountry }) => {
  let title = 'Global Stats';
  if (country) {
    title = country;
  }

  return (
    <div>
      { country && (
        <Breadcrumb separator=''>
          <Breadcrumb.Item className='breadcrumb-item' onClick={() => setCountry(null)}>Global Stats</Breadcrumb.Item>
          <Breadcrumb.Separator>></Breadcrumb.Separator>
        </Breadcrumb>
      )}
      <h3 style={{marginBottom: '0px'}}>{title}</h3>
    </div>
  )
}
