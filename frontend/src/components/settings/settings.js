import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import "./settings.css";

const Settings = ({ setShowSettings }) => {
  const dispatch = useDispatch();
  const { orangeStatusMins, redStatusMins } = useSelector((state) => state.appState);

  // Estado em string para permitir campo vazio
  const [orangeInput, setOrangeInput] = useState(String(orangeStatusMins));
  const [redInput, setRedInput] = useState(String(redStatusMins));

  const handleChange = (setter) => (event) => {
    const val = event.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setter(val);
    }
  };

  const applySettings = () => {
    const orange = orangeInput === "" ? 0 : Number(orangeInput);
    const red    = redInput    === "" ? 0 : Number(redInput);

    dispatch({ type: "appState/setOrangeStatusMins", payload: orange });
    dispatch({ type: "appState/setRedStatusMins", payload: red });
    setShowSettings(false);
  };

  return (
    <div className="settings-popup-container">
      <div className="settings-header">
        <h1 className="settings-title">Configurações</h1>
        <div className="close-wrapper" onClick={() => setShowSettings(false)}>
          <div className="close-arrow">
            <div className="close-line" />
            <div className="close-line" />
          </div>
        </div>
      </div>

      <div className="settings-container">
        <label className="setting-label">Indicadores de status:</label>

        <div className="settings-description-block">
          <p className="settings-description">
            Configure os limites (em minutos) para alertas de sensores:
          </p>
          <ul className="settings-hint-list">
            <li>
              <div className="green-status" /> <strong>Verde</strong>: sensor com dado recente.
            </li>
            <li>
              <div className="orange-status" /> <strong>Laranja</strong>: sem atualização por mais de X minutos.
            </li>
            <li>
              <div className="red-status" /> <strong>Vermelho</strong>: sem atualização por mais de Y minutos.
            </li>
          </ul>
        </div>

        <div className="status-options-container">
          <StatusInput
            label="Laranja após (min)"
            colorClass="orange-status"
            value={orangeInput}
            onChange={handleChange(setOrangeInput)}
          />
          <StatusInput
            label="Vermelho após (min)"
            colorClass="red-status"
            value={redInput}
            onChange={handleChange(setRedInput)}
          />
        </div>
      </div>

      <div className="settings-footer">
        <button className="settings-submit-button" onClick={applySettings}>
          Aplicar
        </button>
      </div>
    </div>
  );
};

const StatusInput = ({ label, colorClass, value, onChange }) => (
  <div className="status-option">
    <div className={colorClass} />
    <input
      className="status-input no-spin"
      type="number"
      min="0"
      value={value}
      onChange={onChange}
      inputMode="numeric"
      pattern="\d*"
    />
    <label className="status-mins-label">{label}</label>
  </div>
);

export default Settings;