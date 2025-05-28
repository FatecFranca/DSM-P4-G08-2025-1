import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { useSelector } from 'react-redux';

import convertToTime from '../../utils/convertToTime';
import {
  mean,
  median,
  mode,
  sampleStandardDeviation,
  sampleSkewness
} from 'simple-statistics';

import './chart.css';

const getStats = (values) => {
  const cleanVals = values.map(Number).filter(v => !isNaN(v));
  return {
    media: cleanVals.length ? mean(cleanVals) : NaN,
    mediana: cleanVals.length ? median(cleanVals) : NaN,
    moda: cleanVals.length ? (() => {
      try {
        const m = mode(cleanVals);
        return Array.isArray(m) ? m[0] : m;
      } catch {
        return NaN;
      }
    })() : NaN,
    desvio: cleanVals.length > 1 ? sampleStandardDeviation(cleanVals) : NaN,
    assimetria: cleanVals.length > 2 ? sampleSkewness(cleanVals) : NaN,
  };
};

const formatStat = (v, unit = '') => isNaN(v) ? '--' : `${v.toFixed(2)}${unit}`;

const Chart = ({ sensorData }) => {
  const tempState = useSelector(state => state.tempState);
  const convertedData = convertToTime(sensorData);

  // Proteção contra dados ausentes ou vazios
  if (!convertedData?.data?.length) {
    return <p style={{ color: '#fff' }}>Nenhum dado disponível para exibir os gráficos.</p>;
  }

  const xInterval = () => {
    const length = convertedData?.data?.length || 0;
    const i1 = length / 10;
    return i1 < 30 ? i1 : 30;
  };

  const tempStats = getStats(convertedData.data.map(d => d.temperature));
  const humStats = getStats(convertedData.data.map(d => d.humidity));

  const rightValue = tempState.openGraphCount > 1 ? 10 : 20;

  return (
    <div>
      {/* Temperatura */}
      <h3 style={{ color: '#d1d1d1', marginBottom: '10px' }}>Temperatura</h3>
      <LineChart
        width={400}
        height={300}
        data={convertedData.data}
        margin={{
          top: 5,
          right: rightValue,
          left: -25,
          bottom: 25
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp_TTL"
          interval={xInterval}
          tick={{ fontSize: 15, fill: '#d1d1d1' }}
        />
        <YAxis tick={{ fontSize: 15, fill: '#d1d1d1' }} />
        <Tooltip />
        <Legend
          verticalAlign="bottom"
          height={60}
          wrapperStyle={{ fontSize: 14, color: '#d1d1d1' }}
          payload={[
            { value: `Média: ${formatStat(tempStats.media, '°C')}`, type: 'line', id: '1', color: '#d8a784' },
            { value: `Mediana: ${formatStat(tempStats.mediana, '°C')}`, type: 'line', id: '2', color: '#d8a784' },
            { value: `Moda: ${formatStat(tempStats.moda, '°C')}`, type: 'line', id: '3', color: '#d8a784' },
            { value: `Desvio Padrão: ${formatStat(tempStats.desvio)}`, type: 'line', id: '4', color: '#d8a784' },
            { value: `Assimetria: ${formatStat(tempStats.assimetria)}`, type: 'line', id: '5', color: '#d8a784' }
          ]}
        />
        <Line
          type="monotone"
          dataKey="temperature"
          name="Temperatura"
          stroke="#d8a784"
          strokeWidth={2}
        />
      </LineChart>

      {/* Umidade */}
      <h3 style={{ color: '#d1d1d1', marginTop: '40px', marginBottom: '10px' }}>Umidade</h3>
      <LineChart
        width={400}
        height={300}
        data={convertedData.data}
        margin={{
          top: 5,
          right: rightValue,
          left: -25,
          bottom: 25
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp_TTL"
          interval={xInterval}
          tick={{ fontSize: 15, fill: '#d1d1d1' }}
        />
        <YAxis tick={{ fontSize: 15, fill: '#d1d1d1' }} />
        <Tooltip />
        <Legend
          verticalAlign="bottom"
          height={60}
          wrapperStyle={{ fontSize: 14, color: '#d1d1d1' }}
          payload={[
            { value: `Média: ${formatStat(humStats.media, '%')}`, type: 'line', id: '1', color: '#8884d8' },
            { value: `Mediana: ${formatStat(humStats.mediana, '%')}`, type: 'line', id: '2', color: '#8884d8' },
            { value: `Moda: ${formatStat(humStats.moda, '%')}`, type: 'line', id: '3', color: '#8884d8' },
            { value: `Desvio Padrão: ${formatStat(humStats.desvio)}`, type: 'line', id: '4', color: '#8884d8' },
            { value: `Assimetria: ${formatStat(humStats.assimetria)}`, type: 'line', id: '5', color: '#8884d8' }
          ]}
        />
        <Line
          type="monotone"
          dataKey="humidity"
          name="Umidade"
          stroke="#8884d8"
          strokeWidth={2}
        />
      </LineChart>
    </div>
  );
};

export default Chart;
