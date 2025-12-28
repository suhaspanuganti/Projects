import random
import openpyxl
import time
from twilio.rest import Client
import pandas as pd

# Define normal heart rate range
NORMAL_HEART_RATE_RANGE = (60, 100)

# Define normal blood glucose range
NORMAL_GLUCOSE_RANGE = (70, 120)

# Twilio configuration
ACCOUNT_SID = 'SSID'
AUTH_TOKEN = 'Token'
TWILIO_PHONE_NUMBER = 'YOUR_TWILIO PHONE NUMBER'
TWILIO_CLIENT = Client(ACCOUNT_SID, AUTH_TOKEN)

# Read patient data from Excel file
def read_patient_data_from_excel(file_path):
    wb = openpyxl.load_workbook(filename=file_path)
    sheet = wb.active
    data = []
    for row in sheet.iter_rows(min_row=2, values_only=True):
        name, age, mobile = row[:3]
        data.append({'Name': name, 'Age': age, 'Mobile Number': '+91' + str(mobile)})
    return data

# Define function to simulate heart rate
def simulate_heart_rate():
    if random.randint(1, 500) == 1:
        return random.choice([random.randint(40, 59), random.randint(101, 120)])
    return random.randint(NORMAL_HEART_RATE_RANGE[0], NORMAL_HEART_RATE_RANGE[1])

# Define function to simulate blood glucose level
def simulate_blood_glucose():
    if random.randint(1, 1000) == 1:
        return random.choice([random.randint(40, 69), random.randint(121, 150)])
    return random.randint(NORMAL_GLUCOSE_RANGE[0], NORMAL_GLUCOSE_RANGE[1])

# Define function to check heart rate and generate warnings
def check_heart_rate_cluster(cluster_name, cluster):
    rows = []
    for patient in cluster:
        name = patient['Name']
        age = int(patient['Age'])
        mobile = patient['Mobile Number']
        heart_rate = simulate_heart_rate()
        glucose_level = simulate_blood_glucose()
        heart_status = 'Normal'  # default heart rate status
        glucose_status = 'Normal'  # default blood glucose status

        if heart_rate < NORMAL_HEART_RATE_RANGE[0]:
            message = f"Warning: {name}, your heart rate is low ({heart_rate})"
            send_sms(mobile, message)
            heart_status = 'Low'
            log_data(cluster_name, name, age, mobile, heart_rate, glucose_level, heart_status, glucose_status)
        elif heart_rate > NORMAL_HEART_RATE_RANGE[1]:
            message = f"Warning: {name}, your heart rate is high ({heart_rate})"
            send_sms(mobile, message)
            heart_status = 'High'
            log_data(cluster_name, name, age, mobile, heart_rate, glucose_level, heart_status, glucose_status)

        if glucose_level < NORMAL_GLUCOSE_RANGE[0]:
            message = f"Warning: {name}, your blood glucose level is low ({glucose_level})"
            send_sms(mobile, message)
            glucose_status = 'Low'
            log_data(cluster_name, name, age, mobile, heart_rate, glucose_level, heart_status, glucose_status)
        elif glucose_level > NORMAL_GLUCOSE_RANGE[1]:
            message = f"Warning: {name}, your blood glucose level is high ({glucose_level})"
            send_sms(mobile, message)
            glucose_status = 'High'
            log_data(cluster_name, name, age, mobile, heart_rate, glucose_level, heart_status, glucose_status)

        rows.append([cluster_name, name, age, mobile, heart_rate, heart_status, glucose_level, glucose_status])
    return rows

# Define function to send SMS
def send_sms(to_number, message):
    try:
        message = TWILIO_CLIENT.messages.create(to=to_number, from_=TWILIO_PHONE_NUMBER, body=message)
        print(f"Sent SMS to {to_number} with Message SID: {message.sid}")
    except Exception as e:
        print(f"Failed to send SMS to {to_number}: {str(e)}")

# Define function to log data to a text file
def log_data(cluster_name, name, age, mobile, heart_rate, glucose_level, heart_status, glucose_status):
    with open("health_logs.txt", "a") as file:
        file.write(f"Cluster: {cluster_name}\n")
        file.write(f"Name: {name}\n")
        file.write(f"Age: {age}\n")
        file.write(f"Mobile Number: {mobile}\n")
        file.write(f"Heart Rate: {heart_rate} ({heart_status})\n")
        file.write(f"Blood Glucose: {glucose_level} ({glucose_status})\n")
        file.write("-----------------------------------\n")

# Define class for virtual machines
class VM:
    def __init__(self, vm_id):
        self.vm_id = vm_id

    def process_cluster(self, cluster_name, cluster):
        results = check_heart_rate_cluster(cluster_name, cluster)
        self.write_results_to_vm(results)

    def write_results_to_vm(self, results):
        with open(f"vm{self.vm_id}_results.txt", "w") as file:
            for row in results:
                file.write("\t".join(str(val) for val in row) + "\n")

# Define function for cluster benchmarking
def benchmark_clusters(clusters):
    benchmark_results = []
    for i, cluster in enumerate(clusters):
        cluster_name = f"Cluster {i + 1}"
        cluster_performance = perform_benchmark(cluster)
        benchmark_results.append((cluster_name, cluster_performance))
    benchmark_results.sort(key=lambda x: x[1], reverse=True)  # Sort clusters based on performance (higher is better)
    return benchmark_results

# Define function to perform benchmarking for a single cluster
def perform_benchmark(cluster):
    # Perform benchmark tests and measure cluster performance
    # You can implement your specific benchmarking logic here
    # This function should return a performance score or metric for the cluster
    return random.uniform(0, 1)

# Main function
def main():
    # Read patient data from Excel file
    patient_data = read_patient_data_from_excel("heartdata.xlsx")

    # Shuffle the patient data
    random.shuffle(patient_data)

    # Divide patients into clusters with at least 6 values in each cluster
    num_clusters = (len(patient_data) + 5) // 6
    clusters = [patient_data[i * 6: (i + 1) * 6] for i in range(num_clusters)]

    # Benchmark clusters and allocate tasks based on performance
    benchmark_results = benchmark_clusters(clusters)
    print("Benchmark Results:")
    for i, (cluster_name, _) in enumerate(benchmark_results):
        print(f"Cluster {i + 1}: {cluster_name}")
    print()

    # Create VMs
    num_vms = 3  # Number of VMs
    vms = [VM(vm_id) for vm_id in range(1, num_vms + 1)]

    # Assign clusters to VMs
    for i, (cluster_name, _) in enumerate(benchmark_results):
        vm = vms[i % num_vms]
        vm.process_cluster(cluster_name, clusters[i])

    # Continuously monitor and update output
    while True:
        time.sleep(5)  # Sleep for 5 seconds
        output_data = []
        for vm in vms:
            with open(f"vm{vm.vm_id}_results.txt", "r") as file:
                lines = file.readlines()
                for line in lines:
                    data = line.strip().split("\t")
                    output_data.append(data)
            with open(f"vm{vm.vm_id}_results.txt", "w") as file:
                pass  # Clear the contents of the file
        if output_data:
            df = pd.DataFrame(output_data, columns=['Cluster', 'Name', 'Age', 'Mobile Number', 'Heart Rate', 'Heart Status', 'Blood Glucose', 'Glucose Status'])
            print(df)
            print()

if __name__ == "__main__":
    main()
