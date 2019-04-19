module.exports = {
  collisionCheck,
  findMajority
};

const { timingDifference } = require("../config");

function collisionCheck(timingStart, timingEnd, DBStart, DBEnd) {
  // Find near values
  // For example:
  //   DBStart = 10, timingDifference = 3
  //   Collision if 7 <= timingStart <= 13

  const startCollision = (
    timingStart >= DBStart - timingDifference &&
    timingStart <= DBStart + timingDifference
  );
  const endCollision = (
    timingEnd >= DBEnd - timingDifference &&
    timingEnd <= DBEnd + timingDifference
  );
  return startCollision && endCollision;
}

function findMajority(array) {
  let counter = 0;
  let majorityElement;
  for (let i = 0; i < array.length; i++) {
    if (counter === 0) {
      majorityElement = array[i];
      counter = 1;
    } else if (array[i] === majorityElement) {
      counter++;
    } else {
      counter--;
    }
  }
  return majorityElement;
}
