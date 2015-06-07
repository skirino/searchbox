[indent=4]
uses
    Gtk
    Gdk

init
    Gtk.init(ref args)
    Gtk.Settings.get_default().gtk_key_theme_name = "Emacs"
    var opts = new Options()
    opts.set_args(args)
    var app = new SearchboxApp()
    app.set_options(opts)
    app.show_all()
    Gtk.main()

struct Site
    name: string
    url: string

    def static build(n: string, u: string): Site
        var s = Site()
        s.name = n
        s.url  = u
        return s

    def search(words: array of string)
        var joined = string.joinv(" ", words)
        var full_url = @"$(url)$(joined)"
        var browser = Environment.get_variable("BROWSER")
        var command = @"$(browser) '$(full_url)'"
        try
            Process.spawn_command_line_async(command)
        except e: SpawnError
            print @"Error during executing command '$(command)'"

class Options
    _sites: array of Site

    def set_args(args: array of string)
        _sites = {Site.build("google", "https://www.google.com/search?q=")}
        for arg in args[1 : args.length]
            var ss = arg.split("=", 2)
            _sites += Site.build(ss[0], ss[1])

    def private choose_site(words: array of string): Site?
        if words.length >= 2
            var first_word = words[0]
            if first_word.length <= 2
                for site in _sites
                    if site.name.has_prefix(first_word)
                        return site
        return null

    def choose_site_or_default(words: array of string): Site
        var site = choose_site(words)
        return site == null ? _sites[0] : site

    def choose_site_and_search(words: array of string)
        var site = choose_site(words)
        if site == null
            _sites[0].search(words)
        else
            site.search(words[1 : words.length])

class SearchboxApp : Gtk.Window
    _label: Label
    _entry: Entry
    _options: Options

    init
        title = "searchbox"
        destroy.connect(quit_and_search)
        focus_out_event.connect(quit_on_focus_out)
        init_children()
        init_position()

    def set_options(opts: Options)
        _options = opts
        query_text_changed()

    def private init_children()
        var grid = new Grid()
        add(grid)
        _label = new Label("searchox:")
        grid.add(_label)
        _entry = new Entry()
        _entry.hexpand = true
        _entry.key_press_event.connect(quit_by_ctrl_g)
        _entry.activate.connect(quit_and_search)
        _entry.changed.connect(query_text_changed)
        grid.add(_entry)

    def private init_position()
        window_position = WindowPosition.CENTER
        default_width = 400
        var x = 0
        var y = 0
        get_position(out x, out y)
        move(x, 0)

    def private query_text_changed()
        var site = _options.choose_site_or_default(get_words())
        _label.set_text(@"searchbox ($(site.name)):")

    def private quit_on_focus_out(e: EventFocus): bool
        Gtk.main_quit()
        return false

    def private quit_by_ctrl_g(e: EventKey): bool
        if e.state == ModifierType.CONTROL_MASK && e.keyval == Gdk.Key.g
            Gtk.main_quit()
        return false

    def private quit_and_search()
        var words = get_words()
        Gtk.main_quit()
        if words.length != 0
            _options.choose_site_and_search(words)

    def private get_words(): array of string
        try
            var re = new Regex("[ 　]+")
            return re.split(_entry.get_text())
        except e: RegexError
            Process.exit(1)
