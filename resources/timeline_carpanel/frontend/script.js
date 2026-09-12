const sliderElement = document.querySelector("#range");
var api_key = "";
const post = (url, data = {}) => {
  $.post(`https://${GetParentResourceName()}/${url}`, JSON.stringify(data));
};

const updateSliderBackground = (value) => {
  const progress = (value / sliderElement.max) * 100;
  sliderElement.style.background = `linear-gradient(to right, #ffffff ${progress}%, #d9d9d980 ${progress}%)`;
};

sliderElement.addEventListener("input", (event) => {
  const tempSliderValue = event.target.value;
  post("updateSlider", { value: tempSliderValue / 100 });
  updateSliderBackground(tempSliderValue);
});

const initialValue = sliderElement.value;
updateSliderBackground(initialValue);

const open = (
  fuel,
  gear,
  seat,
  autopilot,
  locked,
  driftmode,
  engine,
  tempomat,
  plate,
  driver,
  only_driver
) => {
  $(".plate-text").text(plate);
  $(".vehicle_door_control").removeClass("active");
  $(".seat" + seat).addClass("active");
  $(".fuel_value").html(`
        ${fuel}<span class="fuel_unit">%</span>
  `);
  $(".fuel_progress").css("height", `${fuel}%`);
  $(".gear.active").removeClass("active");
  $(".gear" + gear).addClass("active");
  $(".control_button.active").removeClass("active");
  if (autopilot) {
    $(".control-autopilot").addClass("active");
  }
  if (locked) {
    $(".control-locked").addClass("active");
  }
  if (driftmode) {
    $(".control-driftmode").addClass("active");
  }
  if (engine) {
    $(".control-engine").addClass("active");
  }
  if (tempomat) {
    $(".control-tempomat").addClass("active");
  }
};

const toggleAutopilot = () => {
  post("toggleAutopilot");
};

const toggleLocked = () => {
  post("toggleLocked");
};

const toggleDriftmode = () => {
  post("toggleDriftmode");
};

const toggleEngine = () => {
  post("toggleEngine");
};

const toggleTempomat = () => {
  post("toggleTempomat");
};

const switchSeat = (seat) => {
  post("switchSeat", { seat: seat });
};

const toggleSong = () => {
  post("toggleSong");
};

const updateData = (url) => {
  $.getJSON(
    "https://noembed.com/embed",
    { format: "json", url: url },
    (data) => {
      $(".song_name").text(data.author_name);
      $(".song_artist").text(data.title.substring(0, 10));
      $(".song_cover1").attr("src", data.thumbnail_url);
    }
  );
};

const getData = (url, callback) => {
  $.getJSON(
    "https://noembed.com/embed",
    { format: "json", url: url },
    (data) => {
      callback(data.thumbnail_url, data.author_name, data.title);
    }
  );
};

const playSong = (url) => {
  post("playSong", { url: url });
};

const backSong = () => {
  post("backSong");
};

const nextSong = () => {
  post("nextSong");
};

const deleteSong = (url) => {
  post("deleteSong", { url: url });
};

const addSong = () => {
  post("addSong", { url: $(".spotify_input").val() });
  $(".spotify_input").val("");
};

window.addEventListener("message", (event) => {
  const data = event.data;
  const action = data.action;

  switch (action) {
    case "init":
      const config = data.config;
      for (const [key, value] of Object.entries(config)) {
        $(".translation_" + key).text(value);
        $(".translation_" + key).attr("placeholder", value);
      }
      break;
    case "updateData":
      updateData(data.url);
      break;
    case "close":
      $(".main_wrapper").fadeOut();
      $(".progress").css("width", "0%");
      $(".max_timer").text("0:00");
      $(".timer").text("0:00");
      $(".song_name").text("Kein Song");
      $(".song_artist").text("Kein Song");
      $(".song_cover1").attr("src", "./assets/images/yt.png");
      $(".song_list").empty();
      $(".main_wrapper").css("animation", "slideToBottom 1s forwards");
      post("close");
      break;
    case "setVolume":
      // sliderElement.value = data.volume * 100;
      // updateSliderBackground(data.volume * 100);
      // $(sliderElement).trigger("input");
      break;
    case "setTime":
      const seconds = data.seconds;
      const max = data.max;
      const minutes = Math.floor(seconds / 60);
      const seconds2 = seconds % 60;
      const minutesMax = Math.floor(max / 60);
      const secondsMax = max % 60;
      $(".progress").css("width", `${(seconds / max) * 100}%`);
      $(".max_timer").text(
        `${minutesMax}:${secondsMax < 10 ? "0" : ""}${secondsMax}`
      );
      $(".timer").text(`${minutes}:${seconds2 < 10 ? "0" : ""}${seconds2}`);
      break;
    case "open":
      open(
        data.fuel,
        data.gear,
        data.seat,
        data.autopilot,
        data.locked,
        data.driftmode,
        data.engine,
        data.tempomat,
        data.plate,
        data.is_driver,
        data.only_driver
      );
      $(".song_list").empty();
      for (let i = 0; i < data.playlist.length; i++) {
        const song = data.playlist[i];
        getData(song, (src, author, title) => {
          $(".song_list").append(`
            <div class="song">
                <img
                    src="${src}"
                    alt=""
                    class="song_cover" />
                <div class="listed_song_informations" onclick="playSong('${song}')">
                    <p>${author} - ${title}</p>
                </div>
                <button class="delete_song_button" onclick="deleteSong('${song}')">
                    <img
                        src="./assets/icons/bin_icon.svg"
                        alt=""
                        class="control_icon" />
                </button>
            </div>
          `);
        });
      }
      $(".main_wrapper").css("animation", "slideToTop 1s forwards");
      $(".main_wrapper").fadeIn();
      break;
    case "update":
      open(
        data.fuel,
        data.gear,
        data.seat,
        data.autopilot,
        data.locked,
        data.driftmode,
        data.engine,
        data.tempomat,
        data.plate,
        data.is_driver
      );
      break;
    default:
      break;
  }
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape") {
    $(".main_wrapper").fadeOut();
    setTimeout(() => {
      $(".main_wrapper").fadeOut();
    }, 200);
    $(".main_wrapper").css("animation", "slideToBottom 1s forwards");
    post("close");
  }
});
