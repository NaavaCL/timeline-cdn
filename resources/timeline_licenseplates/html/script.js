
window.onload = function(e) { 
  window.addEventListener('message', function(event) {
    switch (event.data.menu) {
      case 'openplatechange': 
        $(".form").fadeIn();
      break 
      case 'closeplatechange': 
        $(".form").fadeOut();
      break
  }})
}

function validateInput(inputField) {
  const inputValue = inputField.value;
  const alphanumericRegex = /^[a-zA-Z0-9]*$/;

  if (!alphanumericRegex.test(inputValue)) {
    inputField.value = inputValue.replace(/[^a-zA-Z0-9]/g, '');  
  }
}

$(".btm-first-btn").click(function() {
  $(".form").fadeOut(); 
  $.post(`https://${GetParentResourceName()}/close`, JSON.stringify({}));
})

$(".btm-second-btn").click(function() {
  const plateinput = document.getElementById('inputField').value.trim().toUpperCase();
  
  $.post(`https://${GetParentResourceName()}/changeplate`, JSON.stringify({
    plateinput: plateinput
  }));
});

