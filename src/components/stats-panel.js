import React, { useState } from 'react';
import { Statistic, Card, List, Button } from 'antd';
import { LineChartOutlined, CloseOutlined } from '@ant-design/icons';
import numeral from 'numeral'

import './stats-panel.css';


export default function StatsPanel ({ globalData }) {
  const [minimized, setMinimized] = useState(false);
  const [metric, setMetric] = useState('active');

  console.log('StatsPanel', globalData)
  const total = {
    active: 0,
    confirmed: 0,
    recovered: 0,
    deaths: 0,
  }

  let countryList = Object.entries(globalData).map(([iso3, data]) => {
    total.confirmed += data.confirmed;
    total.active += data.active;
    total.recovered += data.recovered;
    total.deaths += data.deaths;
    return { ...data, iso3 };
  });
  // sort does in place reordering and does not trigger rerender
  console.log('before', countryList.slice(0, 5).map(c => c.countryRegion))
  countryList = [...countryList].sort((c1, c2) => c1[metric] < c2[metric]);
  console.log('after', countryList.slice(0, 5).map(c => c.countryRegion))
  const metricList = Object.keys(total);
  console.log(countryList)

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

  const collapseBtn = (<CloseOutlined onClick={() => setMinimized(true)} />)
  return (
    <Card title="Global Stats" className='stats-panel' extra={collapseBtn}>
      <div className='statsGroup' style={{ display: 'flex', justifyContent: 'space-between' }}>
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