//jshint esversion:6
$(document).ready(function(){
  $(".compose-input").on('change', function() {
    const fileName = $(this).val().split('\\');
    $(".compose-label").html(fileName[fileName.length -1]);
    if ($(".compose-input").val() === "") {
      $(".compose-label").html("Choose file");
    }
  });
});
