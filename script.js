'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = Date.now() + ''.slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.setDescription();
  }
  calcSpeed() {
    //km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
//let map, mapEvent;
class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this.moveToPopup.bind(this));
    //getting the data from local Storage
    this.getLocalStorage();
    document
      .querySelector('.buttonl')
      .addEventListener('click', this.clearLocalStorage.bind(this));
  }
  //for getting the location of the user
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Can't Detect th Position Please Allow the Location Service");
        }
      );
    }
  }
  //for loading the map
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(
      `https://www.google.com/maps/place/Satva+Homes/@${latitude},${longitude}`
    );
    this.#map = L.map('map').setView([latitude, longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup('Home')
      .openPopup();
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this.renderWorkoutMarker(work);
    });
  }
  //for showing the form
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //creating the new Workout

  _newWorkout(e) {
    e.preventDefault();
    const rucy = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const {
      latlng: { lat, lng },
    } = this.#mapEvent;
    let workout;
    const validInput = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp) && inp > 0);
    //if workout is running:
    if (rucy === 'running') {
      const cadence = +inputCadence.value;
      if (!validInput(duration, distance, cadence)) {
        return alert('Please Enter the Valid Data ');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if workout is cycling:

    if (rucy === 'cycling') {
      const elev = +inputElevation.value;
      if (!validInput(duration, distance) || !Number.isFinite(elev)) {
        return alert('Please Enter the Valid Data ');
      }
      workout = new Cycling([lat, lng], distance, duration, elev);
    }
    //adding the workout to the workouts array

    this.#workouts.push(workout);
    console.log(workout);

    //render workout Marker
    this.renderWorkoutMarker(workout);
    //render worjout list
    this.renderWorkout(workout);

    inputDistance.value = '';
    inputCadence.value = '';
    inputDuration.value = '';
    form.classList.toggle('hidden');
    //setting the local storage
    this.setLocalStorage();
  }
  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 30,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup `,
        })
      )
      .setPopupContent('' + workout.description)
      .openPopup();
  }
  renderWorkout(workout) {
    let html = `
  <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">🏃‍♂️</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
    <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;
    if (workout.type === 'running')
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
    <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>
  `;
    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>
  `;
    form.insertAdjacentHTML('afterend', html);
  }
  moveToPopup(ev) {
    const workoutEl = ev.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, 15, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this.renderWorkout(work);
    });
  }
  clearLocalStorage() {
    if (confirm('Are You Sure to Delete All the Workouts?')) {
      localStorage.removeItem('workouts');
      location.reload();
      new App();
    } else {
      return;
    }
  }
}
//starting the Application
new App();
