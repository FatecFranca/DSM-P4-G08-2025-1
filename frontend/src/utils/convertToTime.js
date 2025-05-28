// Converts timestamps to hours and minutes

const convertToTime = (sensorData) => {
  let copiedData = JSON.parse(JSON.stringify(sensorData));
  for (let i=0; i<copiedData.data.length; i++) {
    const ts = copiedData.data[i].timestamp_TTL;
    const date = new Date(ts * 1000);
    const hours = date.getHours();
    const minutes = "" + date.getMinutes();
    copiedData.data[i].timestamp_TTL = hours + ":" + (minutes.length < 2 ? "0" + minutes : minutes);
  }

  return copiedData;
}

export default convertToTime;
