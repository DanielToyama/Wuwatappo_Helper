async function Wt(e){
  await _("set_skip_panel_outside_click_close",{skip:true});
  await _("open_panel_window",{payload:{tab:e??null}});
  await _("set_skip_panel_outside_click_close",{skip:true});
}
