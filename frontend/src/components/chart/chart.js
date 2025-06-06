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
  sampleSkewness,
  linearRegression,
  linearRegressionLine,
  rSquared
} from 'simple-statistics';

import './chart.css';

const getStats = (values) => {
  const clean = values.map(Number).filter(v => !isNaN(v));
  return {
    media: clean.length ? mean(clean) : NaN,
    mediana: clean.length ? median(clean) : NaN,
    moda: clean.length
      ? (() => {
          try {
            const m = mode(clean);
            return Array.isArray(m) ? m[0] : m;
          } catch {
            return NaN;
          }
        })()
      : NaN,
    desvio: clean.length > 1 ? sampleStandardDeviation(clean) : NaN,
    assimetria: clean.length > 2 ? sampleSkewness(clean) : NaN,
  };
};

const formatStat = (v, unit = '') =>
  isNaN(v) ? '--' : `${v.toFixed(2)}${unit}`;

const parseHHmmToMinutes = (hhmm) => {
  if (typeof hhmm !== 'string') return NaN;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
};


const minutesToHHmm = (minutes) => {
  const total = ((minutes % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
};

const Chart = ({ sensorData }) => {
  const tempState = useSelector(state => state.tempState);
  const convertedData = convertToTime(sensorData);

  if (!convertedData?.data?.length) {
    return <p style={{ color: '#fff' }}>Nenhum dado disponível para exibir os gráficos.</p>;
  }

  const xInterval = () => {
    const len = convertedData.data.length;
    const i1 = len / 10;
    return i1 < 30 ? i1 : 30;
  };

  const tempStats = getStats(convertedData.data.map(d => d.temperature));
  const humStats  = getStats(convertedData.data.map(d => d.humidity));

  const tempPairs = convertedData.data
    .map(d => {
      const minutos = parseHHmmToMinutes(d.timestamp_TTL);
      const t = Number(d.temperature);
      return (!isNaN(minutos) && !isNaN(t))
        ? [minutos, t]
        : null;
    })
    .filter(p => p !== null);

  let tempRegInfo = {
    regressao: NaN,
    forecast: NaN,
    forecastLabel: '--'
  };

  if (tempPairs.length > 1) {
    const { m: slope, b: intercept } = linearRegression(tempPairs);
    const lineFn = linearRegressionLine({ m: slope, b: intercept });

    const r2 = rSquared(tempPairs, lineFn);

    const lastMin = tempPairs[tempPairs.length - 1][0];
    const nextMin = lastMin + 60;
    const forecastValue = lineFn(nextMin);
    const forecastLabel = minutesToHHmm(nextMin);

    tempRegInfo = { regressao: r2, forecast: forecastValue, forecastLabel };
  }

  const humPairs = convertedData.data
    .map(d => {
      const minutos = parseHHmmToMinutes(d.timestamp_TTL);
      const h = Number(d.humidity);
      return (!isNaN(minutos) && !isNaN(h))
        ? [minutos, h]
        : null;
    })
    .filter(p => p !== null);

  let humRegInfo = {
    regressao: NaN, 
    forecast: NaN,
    forecastLabel: '--'
  };

  if (humPairs.length > 1) {
    const { m: slopeH, b: interceptH } = linearRegression(humPairs);
    const lineFnH = linearRegressionLine({ m: slopeH, b: interceptH });

    const r2H = rSquared(humPairs, lineFnH);

    const lastMinH = humPairs[humPairs.length - 1][0];
    const nextMinH = lastMinH + 60;
    const forecastValueH = lineFnH(nextMinH);
    const forecastLabelH = minutesToHHmm(nextMinH);

    humRegInfo = { regressao: r2H, forecast: forecastValueH, forecastLabel: forecastLabelH };
  }

  const rightValue = tempState.openGraphCount > 1 ? 10 : 20;

  return (
    <div>
      <h3 style={{ color: '#d1d1d1', marginBottom: '10px' }}>Temperatura</h3>
      <LineChart
        width={400}
        height={300}
        data={convertedData.data.map(d => ({
          timestamp_TTL: d.timestamp_TTL,
          temperature: Number(d.temperature)
        }))}
        margin={{ top: 5, right: rightValue, left: -25, bottom: 25 }}
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
          height={100}
          wrapperStyle={{ fontSize: 14, color: '#d1d1d1', marginLeft: '20px' }}
          payload={[
            { value: `Média: ${formatStat(tempStats.media, '°C')}`,      type: 'line', id: '1', color: '#d8a784' },
            { value: `Mediana: ${formatStat(tempStats.mediana, '°C')}`,  type: 'line', id: '2', color: '#d8a784' },
            { value: `Moda: ${formatStat(tempStats.moda, '°C')}`,        type: 'line', id: '3', color: '#d8a784' },
            { value: `Desvio Padrão: ${formatStat(tempStats.desvio)}`,    type: 'line', id: '4', color: '#d8a784' },
            { value: `Assimetria: ${formatStat(tempStats.assimetria)}`,  type: 'line', id: '5', color: '#d8a784' },
            { value: `Regressão: ${isNaN(tempRegInfo.regressao) ? '--' : (tempRegInfo.regressao * 100).toFixed(2) + '%'}`, 
              type: 'line', id: '6', color: '#d8a784' 
            },
            { value: `Previsão (1 h – ${tempRegInfo.forecastLabel}): ${formatStat(tempRegInfo.forecast, '°C')}`, 
              type: 'line', id: '7', color: '#d8a784' 
            }
          ]}
        />

        <Line
          type="monotone"
          dataKey="temperature"
          name="Temperatura"
          stroke="#d8a784"
          strokeWidth={2}
          dot={{ r: 2 }}
          connectNulls={false}
        />
      </LineChart>
      <h3 style={{ color: '#d1d1d1', marginTop: '40px', marginBottom: '10px' }}>Umidade</h3>
      <LineChart
        width={400}
        height={300}
        data={convertedData.data.map(d => ({
          timestamp_TTL: d.timestamp_TTL,
          humidity: Number(d.humidity)
        }))}
        margin={{ top: 5, right: rightValue, left: -25, bottom: 25 }}
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
          height={100}
          wrapperStyle={{ fontSize: 14, color: '#d1d1d1', marginLeft: '20px' }}
          payload={[
            { value: `Média: ${formatStat(humStats.media, '%')}`,      type: 'line', id: '1', color: '#8884d8' },
            { value: `Mediana: ${formatStat(humStats.mediana, '%')}`,  type: 'line', id: '2', color: '#8884d8' },
            { value: `Moda: ${formatStat(humStats.moda, '%')}`,        type: 'line', id: '3', color: '#8884d8' },
            { value: `Desvio Padrão: ${formatStat(humStats.desvio)}`,   type: 'line', id: '4', color: '#8884d8' },
            { value: `Assimetria: ${formatStat(humStats.assimetria)}`, type: 'line', id: '5', color: '#8884d8' },
            { value: `Regressão: ${isNaN(humRegInfo.regressao) ? '--' : (humRegInfo.regressao * 100).toFixed(2) + '%'}`, 
              type: 'line', id: '6', color: '#8884d8' 
            },
            { value: `Previsão (1 h – ${humRegInfo.forecastLabel}): ${formatStat(humRegInfo.forecast, '%')}`, 
              type: 'line', id: '7', color: '#8884d8' 
            }
          ]}
        />

        <Line
          type="monotone"
          dataKey="humidity"
          name="Umidade"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 2 }}
          connectNulls={false}
        />
      </LineChart>
    </div>
  );
};

export default Chart;