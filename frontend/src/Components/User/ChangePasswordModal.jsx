import React from 'react'
import Button from '../Common/Button';


const ControlModal = (closeModal, password, setPassword, submit) => {


    return (
        <div className='fixed inset-0 flex items-center justify-center bg-transparent '>
            <div className='text-white bg-gray-800 p-4 rounded-2xl h-1/4 w-1/4 flex flex-col justify-between'>
                <div>
                    <h2 className='text-xl mb-4'>UAV CHANGE PASSWORD</h2>
                </div>
                <input className='border-2 rounded-2xl border-white p-2' type="text" value={password} onChange={e => setPassword(e.target.value)} />
                <div className='flex gap-4 justify-center'>
                    <Button func={closeModal} command={"Close"} />
                    <Button func={submit} command={"Submit"}></Button>
                </div>
            </div>

        </div >
    )
}

export default ControlModal
