<?php

namespace Als\Wire;


use Illuminate\Support\ServiceProvider;
use Als\Wire\Http\Controllers\WireController;

class WireServiceProvider extends ServiceProvider {

    public function boot() {
    }

    public function register() {
        $this->commands([
            Console\MakeWireController::class,
            Console\AddJs::class,
        ]);
    }

    // private function addToAppJs() {
    //     $app = fopen(base_path('resources/js/app.js'), "a") or die("Unable to open file!");
    //     $txt = "\nrequire('./wire/wire');\n";
    //     fwrite($app, $txt);
    //     fclose($app);
    // }

}
