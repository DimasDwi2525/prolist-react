<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\Finance\DeliveryOrderController;

Route::get('/finance/delivery-orders', [DeliveryOrderController::class, 'index']);
Route::post('/finance/delivery-orders', [DeliveryOrderController::class, 'store']);
Route::get('finance/delivery-orders/{id}', [DeliveryOrderController::class, 'show']);
Route::put('/finance/delivery-orders/{id}', [DeliveryOrderController::class, 'update']);
Route::delete('finance/delivery-orders/{id}', [DeliveryOrderController::class, 'destroy']);
