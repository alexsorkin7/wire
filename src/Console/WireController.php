<?php

namespace als\Wire\Console;

use Illuminate\Console\Command;

class WireController extends Command {

    protected $signature = 'make:wireController {name}';
    protected $description = 'Makes Wire controller';

    public function handle() {
        copy('makeController.php', base_path('App/Http/Controllers/'.$name.'.php'));
    }
}
