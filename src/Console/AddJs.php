<?php

namespace als\Wire\Console;

use Illuminate\Console\Command;

class AddJs extends Command {

    protected $signature = 'wire:js';
    protected $description = 'Add wire.js';

    public function handle() {
        self::makeWireJs();
        self::addToApp();
        
    }

    private function addToApp() {
        $app = fopen('resources/js/app.js', "a") or die("Unable to open file!");
        $txt = "\nrequire('./wire');\n";
        fwrite($app, $txt);
        fclose($app);
    }

    private function makeWireJs() {
        $wireJs = fopen('resources/js/wire.js', "w") or die("Unable to open file!");
        $txt = "
import Wire from '../../vendor/als/wire/src/wire';
//To create new wire object let wire = new Wire('divElement');
        ";
        fwrite($wireJs, $txt);
        fclose($wireJs);
    }


}
