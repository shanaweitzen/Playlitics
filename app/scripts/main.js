var lib = new localStorageDB("playlist", localStorage);

var createLocatStorageDB = function () {
  if(lib.isNew()) {
    lib.createTable("playlist", ["name",  "totalDuration", "coolnessFactor", "songs", "tags"]);
    lib.commit();
  }
};

var updateLocalStorageDB = function (playlistSelected, songsArray, tagsArray) {
  lib.insertOrUpdate("playlist",
    {name: playlistSelected },
    { 
      name: playlistSelected,
      totalDuration: calculatePlaylistDuration(playlistSelected),
      coolnessFactor: calculatePlaylistPopularity(playlistSelected),
      songs: songsArray ,
      tags: tagsArray
    });

  lib.commit();
};

var calculatePlaylistDuration = function(playlistName) {
  var durationArray = [];
  var total = 0;
  var songLength = lib.queryAll("playlist", {query: {name: playlistName}})[0].songs.length;
  var songs = lib.queryAll("playlist", {query: {name: playlistName}})[0].songs;

  for(var i = 0; i < songLength ; i++ ) {
    durationArray.push(parseInt(songs[i].duration_ms));
  }

  $.each(durationArray,function() {
    total += this;
  });

  return millisToMinutesAndSeconds(total);

};

var calculatePlaylistPopularity = function(playlistName) {
  var playlistCoolnessFactor;
  var popularityArray = [];
  var popularityTotal = 0;
  var totalNumberOfSongs = lib.queryAll("playlist", {query: {name: playlistName}})[0].songs.length;
  var songs = lib.queryAll("playlist", {query: {name: playlistName}})[0].songs; 

  for(var i = 0; i < totalNumberOfSongs ; i++ ){
    popularityArray.push(parseInt(songs[i].popularity));  
  }

  $.each(popularityArray, function() {
    popularityTotal += this;
  });

  playlistCoolnessFactor = (popularityTotal > 0) ? Math.round(popularityTotal/totalNumberOfSongs) : "0";
  return playlistCoolnessFactor;
};

var searchSongs = function(query) {
  if (query.length > 0) {
    $.ajax({
      url: "https://api.spotify.com/v1/search?q=" + query + "&type=track&limit=5&q=",
      dataType: "json",
      success: function(response) {
        displayInputOptions(response.tracks.items);
      },
      error: function(error) {
        console.log(error);
      }
    });
  }
};

var displayInputOptions = function(response) {
    if (response !== null) {
      $.each(response, function (index, item) {
         var options = $("#response");
            options.append($("<option />").val(item["name"]).text(item["name"]));
            var seen = {};
            $("#response option").each(function () {
                  var txt = $(this).text();
                  if (seen[txt]){
                    $(this).remove();
                  } else {
                    seen[txt] = true;
                  }
                      
              });
        });
    }
};


var addPlaylist = function(){
   $('<li>'+ $('input.newPlaylist').val() +'</li>').prependTo('#playlist');
   $('input.newPlaylist').addClass('hidden');
   $('.submitPlaylist').addClass('hidden');
   $('input.newPlaylist').val('');

};


var showPlaylistInput = function() {
    $('input.newPlaylist').removeClass('hidden');
    $('.submitPlaylist').removeClass('hidden');
};


var displaySongs = function(response){
  $.ajax({
        url: "https://api.spotify.com/v1/search?q=" + $('input.search').val().trim() + "&type=track&limit=50&q=",
        dataType: 'json',
        success: function(response) {
         appendToList(response.tracks.items);
        },
        error: function(error){
          console.log("error", error);
        }
      });
};


var appendToList = function (data) {
  $.each(data, function(index, item) {
    var dataImg = (item.album.images[2].url) ? item.album.images[2].url : item.album.images[0].url;
    var ul = $('ul#results');
    var li = $('<li data-uid="'+ generateUUID() +'" data-img="'+ dataImg +'" data-name="'+ item.name +'" data-album="'+ item.album.name +'" data-target="#playlistModal"  data-toggle="modal"/>'); 
    var div = $('<div />');
    var previewSpan = $('<span class="glyphicon glyphicon-play-circle" />');
    var addSpan = $('<span class="addSong glyphicon glyphicon-plus-sign" />');       
    var songTitle = $('<p  data-title="'+ item.name +'" clas="songTitle" />');
    var artistName = $('<p data-artist="'+ item.artists[0].name +'" class="artistName" />');
    var albumName = $('<p data-album="'+ item.album.name +'" clas="albumName" />');
    var popularitySpan = $('<span data-popularity="'+ item.popularity +'" class="popularitySpan glyphicon glyphicon-heart-empty"/>');
    var timeSpan = $('<span data-duration="'+ millisToMinutesAndSeconds(item.duration_ms)+'" class="timeSpan" />');
    var msSpan = $('<span data-duration-ms="'+ item.duration_ms+'" class="millisSpan" />');
    var albumImg = $('<img class="albumImg" src="'+ item.album.images[2].url +'" >');  

    songTitle.text(item.name);
    artistName.text(item.artists[0].name);
    albumName.text(shortname(item.album.name));
    popularitySpan.text(item.popularity);
    timeSpan.text(millisToMinutesAndSeconds(item.duration_ms));
    albumImg.appendTo(li);
    songTitle.appendTo(li);
    artistName.appendTo(li);
    albumName.appendTo(li);
    timeSpan.appendTo(li);
    msSpan.appendTo(li);
    popularitySpan.appendTo(li);
    addSpan.appendTo(li);
    li.appendTo(ul);
  });
};

var shortname = function(name) {
  var albumName = name;
  if (albumName.length > 13) {
    var shortName = albumName.slice(0, 13) + "...";
    return shortName;
  } else {
    return albumName;
  }
};

var millisToMinutesAndSeconds = function(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
};


var showPlaylistModal = function(artist, songName, albumName, albumImg, songPopularity , songDuration , songMSDuration, uid) {
  $("ul.modal-playlist li").remove();
  lib.queryAll("playlist", {
    query: function(row){
      $('<li data-uid="'+ uid +'" data-img="'+ albumImg +'" data-dismiss="modal" data-artist="'+ artist +'" data-song="'+ songName +'" data-album="'+ albumName +'" data-popularity="'+ songPopularity +'" data-duration-ms="'+ songMSDuration +'"data-duration="'+ songDuration +'">'+ row.name + '</li>').appendTo("ul.modal-playlist");
    }
  });
  $("ul#results li").remove();
};

var addSongToPlaylist = function(uid, artist, albumName, albumImg, songDuration, songMSDuration, playlistSelected, songPopularity, songName ) {
  var newSong = {
    id: uid,
    artist: artist,
    albumName: albumName,
    albumImg : albumImg,
    duration: songDuration,
    duration_ms: songMSDuration,
    playlistName: playlistSelected,
    popularity: songPopularity,
    name: songName   
  };
  var songsArray = (lib.queryAll("playlist", {query: {name: playlistSelected }})[0].songs);
  var tagsArray = (lib.queryAll("playlist", {query: {name: playlistSelected }})[0].tags);
  songsArray.push(newSong);
  updateLocalStorageDB(playlistSelected, songsArray, tagsArray);
};

var addTagsToPlaylist = function(playlistSelected, songsArray, playlistDuration, playlistPopularity, tagsArray, newTag) {
  if($("input.tags").val().length <= 0) {
    alert("no tags to save");
  } 

  tagsArray.push(newTag);
  $('<li>'+ $("input.tags").val().trim() + '</li>').appendTo("ul#tagList");
  updateLocalStorageDB(playlistSelected, songsArray, tagsArray); 
};

var createPlaylistPage = function() {
  showPlaylist();
};

var showSearch = function ()  {
  $("div#playlistPage").addClass("hidden");
  $("div#search").removeClass("hidden");
  $("div#playlistDetail").addClass("hidden");
  $("ul#playlistSongList li").remove();
};

var showPlaylist = function() {
  $("div#playlistPage").removeClass("hidden");
  $("div#search").addClass("hidden");
  $("div#playlistDetail").addClass("hidden");
  $("ul#playlist li").remove();
  $("ul#playlistSongList li").remove();
  lib.queryAll("playlist", {
    query: function(row){
      createPlayListBlock(row.name , row.coolnessFactor, row.totalDuration , row.tags);
    }
  });
};

var whatIsTheCoolNessFactor = function(coolnessfactor) {
    alert(coolnessfactor);
};

var savePlaylist = function() {
  if ($("input#createPlaylist").val().length === 0) {
    alert("must type a name to save a playlist");
    return;
  }

  lib.insertOrUpdate("playlist", {name: $("input#createPlaylist").val().trim()}, { name: $("input#createPlaylist").val().trim(), id: "", totalDuration: "", coolnessFactor: "", songs: [], tags: [] });
  lib.commit();
  var name = $("input#createPlaylist").val().trim();
  var playlistPopularity = "n/a" ;
  var totalDuration  = "n/a";
  var tags = [];

  createPlayListBlock(name, playlistPopularity , totalDuration , tags);

  $("input#createPlaylist").val(" ");
  
};

var createPlayListBlock = function (name, playlistPopularity , totalDuration, tags) {
  var ul = $("ul#playlist");
  var li = $('<li data-name="'+ name +'"  data-popularity="'+ playlistPopularity +'"/>');
  var playlistName = $('<span />');
  var playlistDuration = $('<span data-duration="'+ totalDuration +'"/>');
  var coolnessFactor = $('<span class="popularity" data-popularity="'+ playlistPopularity +'" />');
  var rightArrow = $('<a href="#" class="goToPlaylist glyphicon glyphicon-chevron-right" />');
  var tagInput = $('<input maxlength="20" type="text" class="form-control tags" placeholder="add tag" data-name='+ name +'>');
  var tagList = $('<ul id="tagList"/>');
  var addTagMsg = $('<span class="addTag" />');
  var tagImg = $('<span class="glyphicon glyphicon-tag tagImg"/>');
  var divAddTag = $('<div class="addTagBtn '+ name +'" onclick="showTagForm()"/>');
  var saveTag = $('<span class="saveTag btn" />');
  var divTagForm = $('<div id="'+ name + '" class="tagForm" />');
  var iTag = $('<i class="glyphicon glyphicon-tag"/>');

  for (var i = 0; i < tags.length; i++ ) {
    $('<li>'+ tags[i] + '</li>').appendTo(tagList);
  }

  playlistName.text(name);
  playlistDuration.text("duration: " + totalDuration);
  coolnessFactor.text("popularity: " + playlistPopularity);
  addTagMsg.text(" add tag");
  saveTag.text("save");
  playlistName.appendTo(li);
  playlistDuration.appendTo(li);
  coolnessFactor.appendTo(li);
  rightArrow.appendTo(li);
  tagInput.appendTo(divTagForm);
  saveTag.appendTo(divTagForm);
  divTagForm.appendTo(li);
  tagList.appendTo(li);
  li.appendTo(ul);

};

var showPlayListDetail = function(playlistName, data, ul) {
  $("div#playlistPage").addClass("hidden");
  $("div#playlistDetail").removeClass("hidden");
  $("#playlistDetail .detailHeader > h1").text(playlistName);

  $.each(data, function(index, item) {
    var artist = (item.artist)? item.artist : "";
    var li = $('<li data-uid="'+ item.id +'"/>'); 
    var div = $("<div />");
    var previewSpan = $("<span class=\"glyphicon glyphicon-play-circle\" />");
    var addSpan = $("<span class=\"addSong glyphicon glyphicon-plus\" />");      
    var songTitle = $('<p  data-title="'+ item.name +'" clas="songTitle" />');
    var artistName = $('<p data-artist="'+ artist +'" class="artistName" />');
    var albumName = $('<p data-album="'+ item.albumName +'" clas="albumName" />');
    var albumImg = $('<img src="'+ item.albumImg +'">');
    var popularitySpan = $('<span data-popularity="'+ item.popularity +'" class="popularitySpan glyphicon glyphicon-heart-empty"/>');
    var timeSpan = $('<span data-duration="'+ item.duration +'" class="timeSpan" />');
    var trash = $('<span data-title="'+ item.name +'"data-playlist="'+ playlistName +'" class="glyphicon glyphicon-trash trash" />');

    songTitle.text(item.name);
    artistName.text(artist);
    albumName.text(item.albumName);

    popularitySpan.text(item.popularity);
    timeSpan.text(item.duration);
    albumImg.appendTo(li);
    songTitle.appendTo(li);
    artistName.appendTo(li);
    albumName.appendTo(li);
    timeSpan.appendTo(li);
    popularitySpan.appendTo(li);
    li.appendTo(ul);
    trash.appendTo(li);
  });

};


var deleteSongFromPlaylist = function(playlistSelected, songName, uid, songsArray, tagsArray) {
  for( var i = 0; i < songsArray.length; i++) {
    if(songsArray[i].id === uid) {
      songsArray.splice(i, 1);
    }
  }
  updateLocalStorageDB(playlistSelected, songsArray, tagsArray);
};


var generateUUID = function() {
  var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
      d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

$(function() {
    $( "#playlistSongList" ).sortable();
    $( "#playlistSongList" ).disableSelection();
});

var bindEvents = function() {

  $('input.search' ).keyup(function(e) {
    e.preventDefault();
    if(e.keyCode !== 38 && e.keyCode !== 40) {
      searchSongs($('input.search').val().trim());
    }
  });

  $('input.search').on("change keyup paste", function() {
    $("#results li").remove();
  });

 //SHOW MODAL
  $('#search').on("click", "#results li", function() {     
    var artist =  $(this).find("p.artistName").attr("data-artist");
    var songName = $(this).attr("data-name");
    var albumName = $(this).attr("data-album");
    var albumImg = $(this).attr("data-img");
    var songPopularity = $(this).find("span.popularitySpan").attr("data-popularity");
    var songDuration = $(this).find("span.timeSpan").attr("data-duration");
    var songMSDuration = $(this).find("span.millisSpan").attr("data-duration-ms");
    var uid = $(this).attr("data-uid");
    showPlaylistModal(artist, songName, albumName, albumImg, songPopularity , songDuration , songMSDuration, uid);
  });

  //ADD SONG TO PLAYLIST
  $("#playlistModal").on("click", ".modal-playlist li", function(){
    var uid = $(this).attr("data-uid");
    var artist = $(this).attr("data-artist");
    var albumName = $(this).attr("data-album");
    var albumImg = $(this).attr("data-img");
    var songDuration = $(this).attr("data-duration");
    var songMSDuration = $(this).attr("data-duration-ms");
    var playlistSelected = $(this).text();
    var songPopularity = $(this).attr("data-popularity");
    var songName = $(this).attr("data-song");
    addSongToPlaylist(uid, artist, albumName, albumImg, songDuration, songMSDuration, playlistSelected, songPopularity, songName);
  });

  //add Tags to playlist
  $("#playlistPage").on("click", ".saveTag.btn", function() {
    var playlistSelected = $(this).parent().attr("id");
    var songsArray = (lib.queryAll("playlist", {query: {name: playlistSelected }})[0].songs);
    var playlistDuration = lib.queryAll("playlist", {query: {name: playlistSelected }})[0].duration;
    var playlistPopularity = lib.queryAll("playlist", {query: {name: playlistSelected }})[0].coolnessFactor;
    var tagsArray = lib.queryAll("playlist", {query: {name: playlistSelected }})[0].tags;
    var newTag = $("input.tags").val().trim();
    addTagsToPlaylist(playlistSelected, songsArray, playlistDuration, playlistPopularity, tagsArray, newTag);     
  });

  //go to playlist details
  $("#playlistPage").on("click", "ul#playlist li a.goToPlaylist", function(){
    var playlistName = $(this).parent().attr("data-name");
    var data = lib.queryAll("playlist", {query: {name: playlistName}})[0].songs;      
    var ul = $("#playlistSongList");
    showPlayListDetail(playlistName, data, ul);
  });

  //delete song
  $("#playlistDetail").on("click", "#playlistSongList li span.trash", function() {
    var playlistSelected = $(this).attr("data-playlist");
    var songName = $(this).attr("data-title");
    var uid = $(this).parent().attr("data-uid");
    var songsArray = (lib.queryAll("playlist", {query: {name: playlistSelected }})[0].songs);
    var tagsArray = (lib.queryAll("playlist", {query: {name: playlistSelected }})[0].tags);
    deleteSongFromPlaylist(playlistSelected, songName, uid, songsArray, tagsArray);  
    $(this).parent().css({"display" : "none"});
  });

    console.log(localStorage);

}; 

bindEvents();
createLocatStorageDB();















