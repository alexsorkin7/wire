<?php

namespace Als\Wire;


use Illuminate\Support\ServiceProvider;
use Als\Wire\Http\Controllers\WireController;

class WireServiceProvider extends ServiceProvider {

    public function boot() {
        //$this->app->singleton('wire', WireController::class);
        $this->publishes([
            __DIR__.'\Http\Controllers' => 'App/Http/Controllers',
            __DIR__.'\resources\js\wire' => 'resources/js/wire'
        ]);


    }

    public function register() {

    }
}
