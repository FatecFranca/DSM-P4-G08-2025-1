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
import { BarChart, Bar, ResponsiveContainer, LabelList } from "recharts";

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
import { shapiroWilk } from '../../utils/testeShapiroWilk';

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

  // Função para converter timestamp_TTL para minutos desde o início do dia
  const getMinutesFromData = (d) => {
    if (typeof d.timestamp_TTL === 'number') {
      // timestamp em segundos desde epoch
      const date = new Date(d.timestamp_TTL * 1000);
      return date.getHours() * 60 + date.getMinutes();
    } else if (typeof d.timestamp_TTL === 'string') {
      // formato HH:mm
      return parseHHmmToMinutes(d.timestamp_TTL);
    }
    return NaN;
  };

  const tempPairs = convertedData.data
    .map(d => {
      const minutos = getMinutesFromData(d);
      const t = Number(d.temperature);
      if (!isNaN(minutos) && !isNaN(t)) {
        return [minutos, t];
      }
      return null;
    })
    .filter(p => p !== null);

  const humPairs = convertedData.data
    .map(d => {
      const minutos = getMinutesFromData(d);
      const h = Number(d.humidity);
      if (!isNaN(minutos) && !isNaN(h)) {
        return [minutos, h];
      }
      return null;
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

  // Cálculo da probabilidade empírica da temperatura ser maior que 25
  const tempValues = convertedData.data.map(d => Number(d.temperature)).filter(v => !isNaN(v));
  const countAbove25 = tempValues.filter(v => v > 25).length;
  const probAbove25 = tempValues.length > 0 ? (countAbove25 / tempValues.length) : 0;

  // Teste de normalidade Shapiro-Wilk
  let probNormal = null;
  let isNormal = false;
  let shapiroResult = null;
  if (tempValues.length >= 3) {
    shapiroResult = shapiroWilk(tempValues);
    isNormal = shapiroResult && shapiroResult.pValue > 0.05;
    if (isNormal) {
      // Se normal, calcula a probabilidade pela normal
      const meanVal = tempStats.media;
      const stdVal = tempStats.desvio;
      if (!isNaN(meanVal) && !isNaN(stdVal) && stdVal > 0) {
        // P(X > 25) = 1 - P(X <= 25)
        const z = (25 - meanVal) / stdVal;

        probNormal = 1 - (typeof window !== 'undefined' && window.normalCdf ? window.normalCdf(z) : require('../../utils/testeShapiroWilk').normalCdf(z));
      }
    }
  }

  const rightValue = tempState.openGraphCount > 1 ? 10 : 20;

  // Previsão futura usando regressão linear (10, 20, 30, 40, 50 minutos)
  let tempForecastBars = [];
  let humForecastBars = [];
  if (tempPairs.length > 1) {
    const { m: slope, b: intercept } = linearRegression(tempPairs);
    const lineFn = linearRegressionLine({ m: slope, b: intercept });
    const lastMin = tempPairs[tempPairs.length - 1][0];
    tempForecastBars = [10, 20, 30, 40, 50].map(min => {
      const futureMin = lastMin + min;
      const temp = lineFn(futureMin);
      return {
        horario: minutesToHHmm(futureMin),
        temperatura: isFinite(temp) ? parseFloat(temp.toFixed(2)) : null
      };
    }).filter(bar => bar.temperatura !== null && !isNaN(bar.temperatura));
  }
  if (humPairs.length > 1) {
    const { m: slopeH, b: interceptH } = linearRegression(humPairs);
    const lineFnH = linearRegressionLine({ m: slopeH, b: interceptH });
    const lastMinH = humPairs[humPairs.length - 1][0];
    humForecastBars = [10, 20, 30, 40, 50].map(min => {
      const futureMin = lastMinH + min;
      const hum = lineFnH(futureMin);
      return {
        horario: minutesToHHmm(futureMin),
        umidade: isFinite(hum) ? parseFloat(hum.toFixed(2)) : null
      };
    }).filter(bar => bar.umidade !== null && !isNaN(bar.umidade));
  }

  // Ajustar domínio do Y axis para cobrir range dos dados previstos
  let tempMin = tempForecastBars.length ? Math.min(...tempForecastBars.map(b => Number(b.temperatura))) : 0;
  let tempMax = tempForecastBars.length ? Math.max(...tempForecastBars.map(b => Number(b.temperatura))) : 1;
  let humMin = humForecastBars.length ? Math.min(...humForecastBars.map(b => Number(b.umidade))) : 0;
  let humMax = humForecastBars.length ? Math.max(...humForecastBars.map(b => Number(b.umidade))) : 1;
  // Se todos os valores forem iguais, ajuste o domínio para mostrar as barras corretamente
  if (tempMin === tempMax) {
    tempMin = tempMin - 1;
    tempMax = tempMax + 1;
  }
  if (humMin === humMax) {
    humMin = humMin - 1;
    humMax = humMax + 1;
  }

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
      {/* Card de Probabilidades */}
      <div style={{
        background: 'rgba(40, 40, 40, 0.95)',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        padding: '22px 18px 10px 18px',
        margin: '30px auto 0 auto',
        maxWidth: 350,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'inherit',
        border: '1px solid #444'
      }}>
        <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>Probabilidades</div>
        <div style={{ fontSize: '15px', marginBottom: 4 }}>
          Empírica (T &gt; 25°C): <b style={{ color: '#ffd580' }}>{(probAbove25 * 100).toFixed(1)}%</b>
        </div>
        <div style={{ fontSize: '15px', marginBottom: 4 }}>
          Distribuição normal (T &gt; 25°C): <b style={{ color: isNormal ? '#b0e57c' : '#ff8888' }}>{isNormal && probNormal !== null ? (probNormal * 100).toFixed(1) + '%' : 'anormal'}</b>
        </div>
        <div style={{ fontSize: '13px', color: '#aaa', marginTop: 2 }}>
          p-value do teste de normalidade: <b>{shapiroResult && typeof shapiroResult.pValue === 'number' ? shapiroResult.pValue.toFixed(8) : '--'}</b>
        </div>
      </div>
      {/* Gráficos de barras de previsão - formato igual aos gráficos de linha */}
      <h3 style={{ color: '#d1d1d1', marginTop: '40px', marginBottom: '10px' }}>Previsão Temperatura (°C)</h3>
      <ResponsiveContainer width={380} height={230}>
        <LineChart data={tempForecastBars} margin={{ top: 20, right: 20, left: 5, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="horario" tick={{ fill: '#d1d1d1', fontSize: 15 }} />
          <YAxis tick={{ fill: '#d1d1d1', fontSize: 15 }} domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={v => v.toFixed(2)} />
          <Tooltip />
          <Line type="monotone" dataKey="temperatura" name="Temperatura Prevista" stroke="#ffb366" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      <h3 style={{ color: '#d1d1d1', marginTop: '40px', marginBottom: '10px' }}>Previsão Umidade (%)</h3>
      <ResponsiveContainer width={380} height={230}>
        <LineChart data={humForecastBars} margin={{ top: 20, right: 20, left: 5, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="horario" tick={{ fill: '#d1d1d1', fontSize: 15 }} />
          <YAxis tick={{ fill: '#d1d1d1', fontSize: 15 }} domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={v => v.toFixed(2)} />
          <Tooltip />
          <Line type="monotone" dataKey="umidade" name="Umidade Prevista" stroke="#7ecfff" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;