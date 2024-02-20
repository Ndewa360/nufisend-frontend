import { Injectable } from '@angular/core';
import Base64 from 'crypto-js/enc-base64';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Utf8 from 'crypto-js/enc-utf8';
import { cloneDeep } from 'lodash-es';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { user as userData } from 'app/mock-api/common/user/data';

@Injectable({
    providedIn: 'root'
})
export class UploadMockApi
{
    private readonly _secret: any;
    private _user: any = userData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService)
    {
        // Set the mock-api
        this._secret = 'YOUR_VERY_CONFIDENTIAL_SECRET_FOR_SIGNING_JWT_TOKENS!!!';

        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void
    {
        // -----------------------------------------------------------------------------------------------------
        // @ Forgot password - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/upload', 1000)
            .reply(() =>
                [
                    200,
                    true
                ]
            );

      
    }

   
}
