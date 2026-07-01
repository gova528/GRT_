/* ===================================================================
   APP BOOT — runs after every tab module has injected its markup.
=================================================================== */
refreshAuthUI();   // set login button + admin controls
renderGallery();   // load photos
loadStudents();    // load + seed students
loadEvents();      // load events