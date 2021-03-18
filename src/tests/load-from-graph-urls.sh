#!/bin/bash
for graphid in znvwjvv8wg 41c8uy2xoo xa2jew0a9n dw3c2jbczi rdn9xsm0ai wsyb0l9fpy ietknqkjsr utlbo3ifrx b2i93iyk0l 4c7ktmyhxe n51emwwmly fkta2c4gzj sbk9q2p8ft
do
  url="https://saved-work.desmos.com/calc-states/production/$graphid"
  echo "$url"
  curl "$url" >> testStates.js
  echo ',' >> testStates.js
done
