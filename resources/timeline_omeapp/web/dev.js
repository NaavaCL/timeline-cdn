console.log("DEV")
// You can ignore this file. All it does is make the UI work on your browser.
window.addEventListener("load", () => {
  const phoneWrapper = document.getElementById("phone-wrapper");
  const app = phoneWrapper.querySelector(".app");

  if (window.invokeNative) {
    phoneWrapper.parentNode.insertBefore(app, phoneWrapper);
    phoneWrapper.parentNode.removeChild(phoneWrapper);
    return;
  }

  document.getElementById("phone-wrapper").style.display = "block";
  document.body.style.visibility = "visible";

  // Create the Frame element
  const createFrame = (children) => {
    const frame = document.createElement("div");
    frame.classList.add("phone-frame");

    // Create the phone notch (you can style it as needed)
    const notch = document.createElement("div");
    notch.classList.add("phone-notch");

    // Create the phone indicator
    const indicator = document.createElement("div");
    indicator.classList.add("phone-indicator");

    // Create the time
    const time = document.createElement("div");
    time.classList.add("phone-time");
    time.style.color = "white";

    const date = new Date();
    time.innerText =
      date.getHours().toString().padStart(2, "0") +
      ":" +
      date.getMinutes().toString().padStart(2, "0");

    setInterval(() => {
      const date = new Date();
      time.innerText =
        date.getHours().toString().padStart(2, "0") +
        ":" +
        date.getMinutes().toString().padStart(2, "0");
    }, 1000);

    // Create the phone content container and append children to it
    const phoneContent = document.createElement("div");
    phoneContent.classList.add("phone-content");
    phoneContent.appendChild(children);

    // Append the notch and content to the frame
    frame.appendChild(notch);
    frame.appendChild(phoneContent);
    frame.appendChild(indicator);
    frame.appendChild(time);

    return frame;
  };

  const devWrapper = document.createElement("div");
  devWrapper.classList.add("dev-wrapper");

  const frame = createFrame(app);
  devWrapper.appendChild(frame);
  devWrapper.style.display = "block";

  phoneWrapper.parentNode.insertBefore(devWrapper, phoneWrapper);
  phoneWrapper.parentNode.removeChild(phoneWrapper);

  const handleResize = () => {
    const { innerWidth, innerHeight } = window;

    const aspectRatio = innerWidth / innerHeight;
    const phoneAspectRatio = 27.6 / 59;

    if (phoneAspectRatio < aspectRatio) {
      document.documentElement.style.fontSize = "1.66vh";
    } else {
      document.documentElement.style.fontSize = "3.4vw";
    }
  };

  handleResize();

  window.addEventListener("resize", handleResize);
});
