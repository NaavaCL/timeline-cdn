let username

window.addEventListener("message", function(event) {
    var data = event.data
    if (data.type == "loadHTML") {
        loadHTML(data.language)
    } else if (data.type == "openUI") {
        if (data.status) {
            username = data.username
            $('.marry').fadeIn(400);
            $('.username').text(username);
        }
    } else if (data.type == "sound") {
        let audio = new Audio(`${data.sound}`);
        audio.volume = "0.2"
        audio.play();
    } else if (data.type == "confetti") {
        playConfetti(data.length)
    }
})

function marry(bool) {
    $('.marry').fadeOut(400);
    $.post(`https://${GetParentResourceName()}/marry`, JSON.stringify({bool, username}));
}

function loadHTML(language) {
    let css = `
        *{margin:0;padding:0;user-select:none;-webkit-user-drag:none}.marry{position:relative;width:100vw;height:56.25vw;overflow:hidden;text-align:left;font-size:1.04vw;color:#fff}.background{position:absolute;left:35.21vw;top:11.82vw;width:29.64vw;height:32.55vw;background:radial-gradient(56.59% 59.78% at 65.34% 44.46%,var(--background) 100%)}.logo{position:absolute;left:50%;transform:translateX(-50%);top:0;width:5.42vw;height:5.42vw}.title{position:absolute;top:5.83vw;left:50%;width:text;white-space:nowrap;transform:translateX(-50%);color:var(--title-color);text-shadow:0 0 1.67vw var(--title-shadow);font-family:var(--Collonse-font);font-size:2.5vw;font-style:normal;font-weight:400;line-height:normal}.subtitle{position:absolute;bottom:0;left:50%;width:23.96vw;transform:translateX(-50%);color:var(--subtitle-color);text-align:center;text-shadow:0 0 .42vw var(--subtitle-shadow);font-family:var(--Gilroy-font);font-size:.83vw;font-style:normal;font-weight:600;line-height:normal}.username{position:absolute;left:50%;width:26.04vw;transform:translateX(-50%);bottom:0;color:var(--text-color);text-align:center;text-shadow:0 0 .42vw var(--text-shadow);font-family:var(--Gilroy-font);font-size:1.25vw;font-style:normal;font-weight:600;line-height:normal}.question{position:absolute;top:0;left:50%;width:26.04vw;transform:translateX(-50%);color:var(--text-color);text-align:center;text-shadow:0 0 .42vw var(--text-shadow);font-family:var(--Gilroy-font);font-size:1.25vw;font-style:normal;font-weight:600;line-height:normal;opacity:.32}.header{position:absolute;left:2.86vw;top:2.29vw;width:23.96vw;height:11.67vw}.main{position:absolute;top:16.46vw;left:10.68vw;width:8.23vw;height:3.85vw;left:50%;width:text;transform:translateX(-50%)}.buttons{position:absolute;width:22.97vw;height:2.92vw;left:3.33vw;top:25.1vw;display:flex}.button{position:relative;width:11.25vw;height:2.92vw;transition:100ms;margin-right:.47vw;bottom:0}.button:hover{bottom:-0.3vw;transition:100ms}.button-text{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:var(--text-color);text-align:center;text-shadow:0 0 .42vw var(--text-shadow);font-family:var(--Gilroy-font);font-size:.83vw;font-style:normal;font-weight:600;line-height:normal;text-transform:uppercase}.footer{position:absolute;top:29.11vw;left:50%;transform:translateX(-50%);color:var(--text-color);text-align:center;font-family:var(--Gilroy-font);font-size:.73vw;font-style:normal;font-weight:500;line-height:normal;opacity:.32}.ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;width:26.67vw;padding:3.64vw 1.11vw 3.33vw 1.11vw;justify-content:center;align-items:center;opacity:.02}.ring-img{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:24.44vw;height:19.7vw;fill:var(--ring-color)}.shadows{position:absolute;width:29.64vw;height:32.55vw}.shadow{position:absolute;width:10vw;height:10vw;border-radius:15.63vw;opacity:.48;filter:blur(9.27vw)}
    `
    $('.marry').append(`
        <style> ${css} </style>
        <div class="background">
            <div class="ring">
                <svg width="470" height="380" viewBox="0 0 470 380" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M215.682 208.824C211.356 230.519 213.922 253.023 223.021 273.187C215.333 286.189 204.297 296.89 191.064 304.173C172.885 272.869 166.759 236.005 173.837 200.504C177.041 184.518 182.85 169.167 191.032 155.064C204.244 162.382 215.281 173.07 223.021 186.04C219.821 193.208 217.282 200.803 215.682 208.824ZM361.154 86.1253L414.136 57.2933C416.021 56.2701 417.554 54.7011 418.532 52.792C419.51 50.8829 419.889 48.7227 419.618 46.5947L417.272 27.9813C416.992 25.7597 416.021 23.6823 414.495 22.0435C412.969 20.4048 410.967 19.2877 408.77 18.8507L319.234 1.03733C317.038 0.600644 314.76 0.866354 312.723 1.7968C310.686 2.72725 308.993 4.27523 307.885 6.22133L298.594 22.52C297.531 24.3842 297.055 26.5256 297.229 28.6645C297.402 30.8035 298.216 32.8405 299.565 34.5093L337.389 81.304C309.112 78.0623 280.498 83.0046 254.947 95.544C266.947 104.941 277.773 115.917 286.978 128.376C304.428 122.589 323.082 121.434 341.112 125.027C398.893 136.515 436.418 192.675 424.92 250.456C413.421 308.237 357.272 345.763 299.49 334.264C295.262 333.4 291.091 332.278 287 330.904C277.943 343.288 267.238 354.377 255.181 363.864C266.392 369.293 278.381 373.56 291.171 376.109C372.056 392.195 450.68 339.672 466.765 258.776C482.061 181.88 435.298 107.16 361.154 86.1253ZM178.829 376.109C97.9438 392.195 19.3198 339.672 3.2345 258.776C-12.0615 181.88 34.7118 107.16 108.845 86.1253L55.8638 57.2933C53.9784 56.2701 52.4461 54.7011 51.4677 52.792C50.4894 50.8829 50.1107 48.7227 50.3812 46.5947L52.7278 27.9813C53.0025 25.7579 53.9723 23.6781 55.499 22.0384C57.0256 20.3988 59.031 19.2832 61.2292 18.8507L150.765 1.03733C152.962 0.600644 155.24 0.866354 157.277 1.7968C159.314 2.72725 161.006 4.27523 162.114 6.22133L171.405 22.52C172.468 24.3842 172.944 26.5256 172.771 28.6645C172.598 30.8035 171.784 32.8405 170.434 34.5093L132.525 81.4213C209.069 72.4827 280.877 123.619 296.173 200.504C312.248 281.4 259.725 360.013 178.829 376.109ZM254.317 208.824C242.829 151.043 186.669 113.517 128.888 125.016C71.1065 136.515 33.5812 192.664 45.0798 250.445C56.5785 308.227 112.728 345.752 170.509 334.253C228.28 322.765 265.805 266.605 254.317 208.824Z" fill="white"/>
                </svg>
            </div>
            <div class="shadows">
                <div class="shadow" style="left: 0px; top: 0px; background: var(--shadow-left);"></div>
                <div class="shadow" style="right: 0px; bottom: 0px; background: var(--shadow-right);"></div>
            </div>
            <div class="header">
                <img src="./assets/img/logo.png" class="logo">
                <p class="title">${language["title"]}</p>
                <p class="subtitle">${language["subtitle"]}</p>
            </div>
            <div class="main">
                <p class="question">${language["question"]}</p>
                <p class="username">Tony Alvarez</p>
            </div>
            <div class="buttons">
                <div class="button" onclick="marry(true)" style="background: var(--button-yes-color); box-shadow: 0px 0px 28px 0px var(--button-yes-shadow);">
                    <p class="button-text">${language["yes"]}</p>
                </div>
                <div class="button" onclick="marry(false)" style="background: var(--button-no-color); box-shadow: 0px 0px 28px 0px var(--button-no-shadow); margin-right: 0px;">
                    <p class="button-text">${language["no"]}</p>
                </div>
            </div>
            <p class="footer">${language["footer"]}</p>
        </div>
    `)
}


function playConfetti(seconds) {
    const duration = seconds * 1000,
    animationEnd = Date.now() + duration,
    defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
        return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    confetti(
        Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
    );
    confetti(
        Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
    );
    }, 250);
}