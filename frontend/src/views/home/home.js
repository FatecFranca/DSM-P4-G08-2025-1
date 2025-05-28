import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'

import Header from "../../components/header/header";
import Sensor from '../../components/sensor/sensor';
import Settings from '../../components/settings/settings';

import './home.css';
import fetchSensorData from "../../utils/fetchSensorData";
import filterSensorData from "../../utils/filterSensorData";
import sampleData from "../../utils/sampleData";

const Home = () => {
  const dispatch = useDispatch()
  const selectAppState = state => state.appState
  const appState = useSelector(selectAppState)
  const selectTempState = state => state.tempState
  const tempState = useSelector(selectTempState)

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (appState.rawSensorData === null) {
      if (process.env.REACT_APP_MODE === 'demo') {
        const data = sampleData();
        dispatch({ type: 'appState/setRawSensorData', payload: data });
        return;
      } else {
        fetchSensorData()
        .then((fetchedData) => {
          fetchedData = fetchedData.length == 0 ? null : fetchedData;
          dispatch({ type: 'appState/setRawSensorData', payload: fetchedData });
        });
      }
    } else if (appState.filteredSensorData.length === 0) {
      const filteredData = filterSensorData(appState.rawSensorData);
      dispatch({ type: 'appState/setFilteredSensorData', payload: filteredData });
    }
  }, [appState.rawSensorData]);

  return (
    <div className="home-container">
      <Header showSettings={showSettings} setShowSettings={setShowSettings} />
      {showSettings ? <Settings setShowSettings={setShowSettings}/> : null}
      {appState.rawSensorData ? (
        <div className={"sensor-list-container" + (showSettings ? " blur" : "")}>
          {appState.filteredSensorData ? appState.filteredSensorData.map((sensorData, key) => {
            return <Sensor key={key} sensorData={sensorData} showSettings={showSettings}/>
          }
          ) : null}
        </div>
      ) : (
        <div className="no-data-container">
          <p>No data...</p>
        </div>
      )}
      
    </div>
  )
};

export default Home;
