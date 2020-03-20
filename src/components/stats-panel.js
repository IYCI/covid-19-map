import React, { useState } from 'react';
import { Statistic, Card, List, Button } from 'antd';
import { LineChartOutlined, CloseOutlined } from '@ant-design/icons';
import numeral from 'numeral'

import './stats-panel.css';


export default function StatsPanel ({ globalData }) {
  const [minimized, setMinimized] = useState(false);
  const [metric, setMetric] = useState('active');

  const total = {
    active: 0,
    confirmed: 0,
    recovered: 0,
    deaths: 0,
  }

  const countryList = Object.entries(globalData).map(([iso3, data]) => {
    total.confirmed += data.confirmed;
    total.active += data.active;
    total.recovered += data.recovered;
    total.deaths += data.deaths;
    return { ...data, iso3 };
  }).sort((c1, c2) => c2[metric] - c1[metric]);
  const metricList = Object.keys(total);

  if (minimized) {
    return (
      <Button
        onClick={() => setMinimized(false)}
        className="minimized-button"
        icon={<LineChartOutlined />}
        size='large'
      />
    )
  }

  const collapseBtn = (
    <Button
      onClick={() => setMinimized(true)}
      type='link'
      icon={<CloseOutlined />}
      style={{ color: 'rgba(0, 0, 0, 0.45)'}}>
    </Button>
  );
  return (
    <Card title="Global Stats" className='stats-panel' extra={collapseBtn}>
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
      <List
        className='stats-list'
        dataSource={countryList}
        renderItem={country => (
          <List.Item className="stats-list-item">
            {country.countryRegion}
            <span>{numeral(country[metric]).format('0,0')}</span>
          </List.Item>
        )}
      />
    </Card>
  )
}
