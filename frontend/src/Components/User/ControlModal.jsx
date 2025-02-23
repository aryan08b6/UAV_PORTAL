import React from 'react'
import Button from '../Common/Button';
import { useState } from 'react';


const ControlModal = (selectedUav, closeModal, uavFeedRef) => {


    return (
        <div className='fixed inset-0 flex items-center justify-center bg-transparent '>
            <div className='text-white bg-gray-800 p-4 rounded-2xl h-4/5 w-4/5 flex flex-col justify-between'>
                <div>
                    <h2 className='text-xl mb-4'>{selectedUav.name}</h2>
                    <p>Connecting to UAV ID: {selectedUav._id}</p>
                </div>
            
                <video ref={uavFeedRef} autoPlay playsInline className="m-5 bg-black w-[640px] h-[480px]" />

                <div className='flex gap-4 justify-center'>
                    <Button func={closeModal} command={"Close"} />
                    <Button func={() => {console.log("Taking OFFF")}} command={"Take Off"}></Button>
                    <Button func={() => {console.log("Taking OFFF")}} command={"Land "}></Button>
                    <Button func={() => {console.log("Taking OFFF")}} command={"Surveille"}></Button>
                    <Button func={() => {console.log("Taking OFFF")}} command={"Rotate"}></Button>
                    <Button func={() => {console.log("Taking OFFF")}} command={"Upload Schedule"}></Button>
                </div>
            </div>

        </div >
    )
}

export default ControlModal
