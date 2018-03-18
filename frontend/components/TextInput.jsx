import React from 'react'

export default ({name, label, error, type, ...rest}) => {
  const id = `id_${name}`;
  const input_type = type ? type : "text"

  return (
    <div color={error ? "danger" : ""}>
      {label ? <label htmlFor={id}>{label}</label> :  ""}
      <input type={input_type} name={name} id={id} className={error ? "is-invalid" : ""} {...rest} />
      {error ? <span className="invalid-feedback">{error}</span> : ""}
    </div>
  )
}
