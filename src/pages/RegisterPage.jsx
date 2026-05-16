import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from "react";


function RegisterPage() {

  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const { signup, errors: registerErrors, isAuthenticated } = useAuth();

  const navigate = useNavigate();


  const onSubmit = async (values) => {
    await signup(values)
  }

  useEffect(() => {
    if (isAuthenticated) navigate("/")

  }, [isAuthenticated]);


  return (
    <div className="flex h-[calc(100vh-100px)] items-center justify-center">
      <div className='bg-zinc-800 max-w-md p-10 rounded-md'>
        {
          registerErrors.map((error, i) => (
            <div key={i} className='bg-red-500 p-2 text-white'>{error}</div>
          ))
        }
        <h1 className="text-2xl font-bold">Register</h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
        >
          <input type="text" {...register("name", { required: true })}
            className='w-full bg-zinc-700 text-white px-4 py-2 rounded-md my-2'
            placeholder='Name'
          />
          {errors.name && <p className='text-red-500'>name is required</p>}

          <input type="dni" {...register("dni", { required: true })}
            className='w-full bg-zinc-700 text-white px-4 py-2 rounded-md my-2'
            placeholder='DNI'
          />
          {errors.dni && <p className='text-red-500'>dni is required</p>}
          <input type="password" {...register("password", { required: true })}
            className='w-full bg-zinc-700 text-white px-4 py-2 rounded-md my-2'
            placeholder='Password'
          />
          {errors.password && <p className='text-red-500'>password is required</p>}

          <button className="bg-sky-500 text-white px-4 py-2 rounded-md my-2" type="submit">Register</button>
        </form>
        <p className="mt-5 flex gap-x-2 justify-between">
          Already have an account? <Link to='/login' className='text-sky-500'>Login</Link>
        </p>

      </div>
    </div>
  )
}
export default RegisterPage