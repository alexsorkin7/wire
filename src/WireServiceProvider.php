<?php

namespace Als\Wire;


use Illuminate\Support\ServiceProvider;
use Als\Wire\Http\Controllers\WireController;

class WireServiceProvider extends ServiceProvider {

    public function boot() {
        copy(__DIR__.'/Http/Controllers/WireController.php', base_path('App/Http/Controllers/WireController.php'));
        mkdir(base_path('resources/js/wire'));
        copy(__DIR__.'/resources/js/wire/wire.js', base_path('resources/js/wire/wire.js'));
        self::addToAppJs();
    }

    public function register() {
        $this->commands([
            Console\MakeWireController::class,
        ]);
    }

    private function addToAppJs() {
        $app = fopen('resources/js/app.js', "a") or die("Unable to open file!");
        $txt = "\nrequire('./wire/wire');\n";
        fwrite($app, $txt);
        fclose($app);
    }

}
