const filterSensorData = (rawData) => {
  let data = [];
  for (let i=0; i<rawData.length; i++) {
    let foundArr = data.find(({ name }) => name === rawData[i].location)
    if (!foundArr) {
      data.push({
        "name": rawData[i].location,
        "data": [rawData[i]]
      });
    } else {
      foundArr.data.push(rawData[i])
    }
  }

  for (let i=0; i<data.length; i++) {
    data[i].data.sort((t1, t2) => (t1.timestamp_TTL < t2.timestamp_TTL) ? -1 : (t1.timestamp_TTL > t2.timestamp_TTL) ? 1 : 0);
  }

  return data;
};

export default filterSensorData;