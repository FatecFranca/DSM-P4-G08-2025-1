import React, { useState, useEffect } from "react";
import { CSSTransition } from "react-transition-group";
import { useSelector, useDispatch } from 'react-redux';

import Chart from "../chart/chart";

import './sensor.css';

const Sensor = ({ sensorData, showSettings }) => {
  const dispatch = useDispatch();
  const selectAppState = state => state.appState;
  const appState = useSelector(selectAppState);
  const selectTempState = state => state.tempState;
  const tempState = useSelector(selectTempState);

  const [minsSince, setMinsSince] = useState(0);
  const [lastUpdateText, setLastUpdateText] = useState();
  const [time, setTime] = useState(Date.now());
  const [extendData, setExtendData] = useState(false);
  const [indicatorColour, setIndicatorColour] = useState("#4a515f");

  // Última atualização do sensor
  let latestUpdate = sensorData.data[sensorData.data.length - 1];

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000);

    // Ajusta Date.now() (UTC) para UTC-3 subtraindo 3 horas (em segundos)
    const currentTime = Math.floor(Date.now() / 1000) - (3 * 60 * 60);

    const minutesDiff = Math.max(
      0,
      Math.floor((currentTime - latestUpdate.timestamp_TTL) / 60)
    );

    setMinsSince(minutesDiff);

    // Ajusta as cores do indicador segundo o status
    if (minutesDiff >= appState.orangeStatusMins && minutesDiff <= appState.redStatusMins) {
      setIndicatorColour("#cb7900");
    } else if (minutesDiff > appState.redStatusMins) {
      setIndicatorColour("#cb0000");
    } else {
      setIndicatorColour("#00CB24");
    }

    // Texto amigável da atualização
    if (minutesDiff > 100) {
      setLastUpdateText("Mais de uma hora...");
    } else if (minutesDiff === 0) {
      setLastUpdateText("Agora mesmo");
    } else {
      setLastUpdateText(`${minutesDiff} minuto${minutesDiff !== 1 ? 's' : ''} atrás`);
    }

    return () => clearInterval(interval);
  }, [time, latestUpdate.timestamp_TTL, appState]);

  // Gera data ajustada para o gráfico: corrige UTC para UTC-3 (adiciona 3h)
  const chartData = sensorData.data.map(item => ({
    ...item,
    timestamp_TTL: item.timestamp_TTL + (3 * 60 * 60)
  }));

  const clickOnSensor = () => {
    if (!extendData && !showSettings) {
      setExtendData(true);
      dispatch({
        type: 'tempState/updateOpenGraphCount',
        payload: tempState.openGraphCount + 1
      });
    } else {
      setExtendData(false);
      dispatch({
        type: 'tempState/updateOpenGraphCount',
        payload: tempState.openGraphCount - 1
      });
    }
  };

  return (
    <div className="sensor-container" onClick={clickOnSensor}>
      <div className="sensor-header">
        <div className="status-indicator" style={{ backgroundColor: indicatorColour }} />
        <div>
          <h2>{sensorData.name}</h2>
          <p className="sensor-updated">Atualização: {lastUpdateText}</p>
        </div>
      </div>
      <div className={'stats-container' + (extendData ? ' stats-container-extend' : '')}>
        <div className="sensor-output-container">
          <div className="sensor-output-name">TEMPERATURA</div>
          <div className={'sensor-output' + (extendData ? ' sensor-output-extend' : '')}>
            {latestUpdate.temperature}°C
          </div>
        </div>
        <div className="sensor-output-container">
          <div className="sensor-output-name">UMIDADE</div>
          <div className={'sensor-output' + (extendData ? ' sensor-output-extend' : '')}>
            {latestUpdate.humidity}%
          </div>
        </div>
      </div>
      {extendData && (
        <CSSTransition in={extendData} timeout={0} className="my-node" unmountOnExit appear>
          <Chart sensorData={{ ...sensorData, data: chartData }} />
        </CSSTransition>
      )}
    </div>
  );
};

export default Sensor;